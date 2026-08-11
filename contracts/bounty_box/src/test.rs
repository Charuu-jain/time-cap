#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, BytesN, Env, String};

#[test]
fn test_bounty_box_flow() {
    let env = Env::default();
    env.mock_all_signatures();

    let contract_id = env.register_contract(None, BountyBoxContract);
    let client = BountyBoxContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let solver = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_client = token::Client::new(&env, &token_contract.address());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    token_admin_client.mint(&creator, &1000_0000000);

    let secret_solution = String::from_str(&env, "OpenSesame123!");
    
    let mut slice_buf = [0u8; 256];
    let len = secret_solution.len() as usize;
    secret_solution.copy_into_slice(&mut slice_buf[..len]);
    
    let secret_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len]));
    let bounty_amount = 500_0000000i128;

    // Create bounty
    client.create_bounty(&creator, &secret_hash, &bounty_amount, &token_contract.address());

    assert_eq!(token_client.balance(&creator), 500_0000000);
    assert_eq!(token_client.balance(&contract_id), 500_0000000);

    // Claim bounty
    let success = client.claim_bounty(&solver, &secret_solution);
    assert!(success);

    assert_eq!(token_client.balance(&solver), 500_0000000);
    assert_eq!(token_client.balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "Incorrect solution")]
fn test_incorrect_solution_panics() {
    let env = Env::default();
    env.mock_all_signatures();

    let contract_id = env.register_contract(None, BountyBoxContract);
    let client = BountyBoxContractClient::new(&env, &contract_id);

    let creator = Address::generate(&env);
    let solver = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    token_admin_client.mint(&creator, &1000_0000000);

    let secret_solution = String::from_str(&env, "CorrectSecret");
    let mut slice_buf = [0u8; 256];
    let len = secret_solution.len() as usize;
    secret_solution.copy_into_slice(&mut slice_buf[..len]);
    let secret_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len]));

    client.create_bounty(&creator, &secret_hash, &500_0000000i128, &token_contract.address());

    // Try wrong solution
    let wrong_solution = String::from_str(&env, "WrongPassword");
    client.claim_bounty(&solver, &wrong_solution);
}

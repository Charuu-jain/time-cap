#![cfg(test)]

use super::*;
use registry::RegistryContract;
use registry::RegistryContractClient;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{token, Address, BytesN, Env, String};

#[test]
fn test_create_bounty_success() {
    let env = Env::default();
    env.mock_all_auths();

    // Register Registry Contract
    let registry_contract_id = env.register_contract(None, RegistryContract);
    let registry_client = RegistryContractClient::new(&env, &registry_contract_id);

    // Register BountyBox Contract
    let bounty_contract_id = env.register_contract(None, BountyBoxContract);
    let bounty_client = BountyBoxContractClient::new(&env, &bounty_contract_id);

    let creator = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_client = token::Client::new(&env, &token_contract.address());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    token_admin_client.mint(&creator, &1000_0000000);

    let secret_solution = String::from_str(&env, "BountyTest123");
    let mut slice_buf = [0u8; 256];
    let len = secret_solution.len() as usize;
    secret_solution.copy_into_slice(&mut slice_buf[..len]);
    let secret_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len])).into();

    let bounty_amount = 500_0000000i128;

    // 1. Execute create_bounty (triggers ICC to registry.log_bounty)
    bounty_client.create_bounty(
        &token_contract.address(),
        &creator,
        &secret_hash,
        &bounty_amount,
        &registry_contract_id,
    );

    // Verify token balance locked in bounty contract
    assert_eq!(token_client.balance(&creator), 500_0000000);
    assert_eq!(token_client.balance(&bounty_contract_id), 500_0000000);

    // Verify Cross-Contract Log in Registry state
    let logged_creator = registry_client.get_creator(&secret_hash);
    assert_eq!(logged_creator, Some(creator));
}

#[test]
fn test_claim_bounty_success() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_contract_id = env.register_contract(None, RegistryContract);
    let bounty_contract_id = env.register_contract(None, BountyBoxContract);
    let bounty_client = BountyBoxContractClient::new(&env, &bounty_contract_id);

    let creator = Address::generate(&env);
    let solver = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_client = token::Client::new(&env, &token_contract.address());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    token_admin_client.mint(&creator, &1000_0000000);

    let secret_solution = String::from_str(&env, "CorrectPassword!");
    let mut slice_buf = [0u8; 256];
    let len = secret_solution.len() as usize;
    secret_solution.copy_into_slice(&mut slice_buf[..len]);
    let secret_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len])).into();

    let bounty_amount = 400_0000000i128;

    bounty_client.create_bounty(
        &token_contract.address(),
        &creator,
        &secret_hash,
        &bounty_amount,
        &registry_contract_id,
    );

    // 2. Execute claim_bounty with correct password solution
    let success = bounty_client.claim_bounty(&solver, &secret_solution);
    assert!(success);

    // Verify token balance transferred to solver
    assert_eq!(token_client.balance(&solver), 400_0000000);
    assert_eq!(token_client.balance(&bounty_contract_id), 0);
}

#[test]
#[should_panic(expected = "Incorrect solution")]
fn test_claim_bounty_fail_wrong_password() {
    let env = Env::default();
    env.mock_all_auths();

    let registry_contract_id = env.register_contract(None, RegistryContract);
    let bounty_contract_id = env.register_contract(None, BountyBoxContract);
    let bounty_client = BountyBoxContractClient::new(&env, &bounty_contract_id);

    let creator = Address::generate(&env);
    let solver = Address::generate(&env);
    let token_admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(token_admin.clone());
    let token_admin_client = token::StellarAssetClient::new(&env, &token_contract.address());

    token_admin_client.mint(&creator, &1000_0000000);

    let secret_solution = String::from_str(&env, "RightPassword");
    let mut slice_buf = [0u8; 256];
    let len = secret_solution.len() as usize;
    secret_solution.copy_into_slice(&mut slice_buf[..len]);
    let secret_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len])).into();

    bounty_client.create_bounty(
        &token_contract.address(),
        &creator,
        &secret_hash,
        &500_0000000i128,
        &registry_contract_id,
    );

    // 3. Attempt claim_bounty with wrong password (should panic)
    let wrong_solution = String::from_str(&env, "WrongPassword");
    bounty_client.claim_bounty(&solver, &wrong_solution);
}

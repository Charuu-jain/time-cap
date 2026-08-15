#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env, Symbol};

#[test]
fn test_escrow_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let builder = Address::generate(&env);
    let admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_address = token_contract.address();
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    let token = token::Client::new(&env, &token_address);

    let contract_id = env.register(VaultPayContract, ());
    let client = VaultPayContractClient::new(&env, &contract_id);

    // Mint some tokens to sponsor
    token_admin.mint(&sponsor, &1000);
    assert_eq!(token.balance(&sponsor), 1000);

    // Initialize Vault
    let amount = 500;
    let milestone_id = 1;
    client.initialize_vault(&sponsor, &builder, &token_address, &amount, &milestone_id);

    assert_eq!(client.get_status(), Symbol::new(&env, "Created"));

    // Fund Vault
    client.fund_vault(&sponsor);
    assert_eq!(client.get_status(), Symbol::new(&env, "Funded"));
    assert_eq!(token.balance(&sponsor), 500);
    assert_eq!(token.balance(&contract_id), 500);

    // Submit Work
    client.submit_work(&builder);
    assert_eq!(client.get_status(), Symbol::new(&env, "Submitted"));

    // Approve and Release
    client.approve_and_release(&sponsor);
    assert_eq!(client.get_status(), Symbol::new(&env, "Released"));
    assert_eq!(token.balance(&builder), 500);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_refund() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let builder = Address::generate(&env);
    let admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_address = token_contract.address();
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    let token = token::Client::new(&env, &token_address);

    let contract_id = env.register(VaultPayContract, ());
    let client = VaultPayContractClient::new(&env, &contract_id);

    token_admin.mint(&sponsor, &1000);

    let amount = 500;
    client.initialize_vault(&sponsor, &builder, &token_address, &amount, &1);
    client.fund_vault(&sponsor);
    
    assert_eq!(token.balance(&contract_id), 500);
    assert_eq!(token.balance(&sponsor), 500);

    client.refund(&sponsor);
    assert_eq!(client.get_status(), Symbol::new(&env, "Created"));
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&sponsor), 1000);
}

#[test]
#[should_panic(expected = "Invalid status")]
fn test_double_fund_prevention() {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let builder = Address::generate(&env);
    let admin = Address::generate(&env);

    let token_contract = env.register_stellar_asset_contract_v2(admin.clone());
    let token_address = token_contract.address();
    let token_admin = token::StellarAssetClient::new(&env, &token_address);
    let token = token::Client::new(&env, &token_address);

    let contract_id = env.register(VaultPayContract, ());
    let client = VaultPayContractClient::new(&env, &contract_id);

    token_admin.mint(&sponsor, &1000);

    let amount = 500;
    client.initialize_vault(&sponsor, &builder, &token_address, &amount, &1);
    
    client.fund_vault(&sponsor);
    // Should panic because status is now Funded, not Created
    client.fund_vault(&sponsor);
}

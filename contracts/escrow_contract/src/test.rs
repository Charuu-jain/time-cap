#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env, String, Symbol};

fn setup_test_env() -> (
    Env,
    Address,
    Address,
    Address,
    token::Client<'static>,
    token::StellarAssetClient<'static>,
    VaultPayContractClient<'static>,
    Address,
) {
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

    (
        env,
        sponsor,
        builder,
        token_address,
        token,
        token_admin,
        client,
        contract_id,
    )
}

#[test]
fn test_full_happy_path() {
    let (env, sponsor, builder, token_address, token, token_admin, client, contract_id) =
        setup_test_env();

    token_admin.mint(&sponsor, &1000);
    assert_eq!(token.balance(&sponsor), 1000);
    assert_eq!(token.balance(&builder), 0);
    assert_eq!(token.balance(&contract_id), 0);

    let amount = 500;
    let milestone_id = 1;

    // 1. Initialize
    client.initialize_vault(&sponsor, &builder, &token_address, &amount, &milestone_id);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Created"));

    let vault = client.get_vault(&milestone_id);
    assert_eq!(vault.sponsor, sponsor);
    assert_eq!(vault.builder, builder);
    assert_eq!(vault.amount, 500);
    assert_eq!(vault.status, Symbol::new(&env, "Created"));

    // 2. Fund
    client.fund_vault(&milestone_id);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Funded"));
    assert_eq!(token.balance(&sponsor), 500);
    assert_eq!(token.balance(&contract_id), 500);

    // 3. Submit Work
    let pr_url = String::from_str(&env, "https://github.com/stellar/soroban-examples/pull/1");
    client.submit_work(&milestone_id, &pr_url);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Submitted"));
    let vault_after_submit = client.get_vault(&milestone_id);
    assert_eq!(vault_after_submit.deliverable_url, pr_url);

    // 4. Approve and Release
    client.approve_and_release(&milestone_id);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Released"));
    assert_eq!(token.balance(&builder), 500);
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&sponsor), 500);
}

#[test]
fn test_refund_from_funded() {
    let (env, sponsor, builder, token_address, token, token_admin, client, contract_id) =
        setup_test_env();

    token_admin.mint(&sponsor, &1000);
    let milestone_id = 42;

    client.initialize_vault(&sponsor, &builder, &token_address, &600, &milestone_id);
    client.fund_vault(&milestone_id);
    assert_eq!(token.balance(&sponsor), 400);
    assert_eq!(token.balance(&contract_id), 600);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Funded"));

    // Refund
    client.refund(&milestone_id);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Refunded"));
    assert_eq!(token.balance(&sponsor), 1000);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
fn test_refund_from_submitted() {
    let (env, sponsor, builder, token_address, token, token_admin, client, contract_id) =
        setup_test_env();

    token_admin.mint(&sponsor, &1000);
    let milestone_id = 99;

    client.initialize_vault(&sponsor, &builder, &token_address, &300, &milestone_id);
    client.fund_vault(&milestone_id);
    client.submit_work(&milestone_id, &String::from_str(&env, "https://github.com"));
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Submitted"));

    client.refund(&milestone_id);
    assert_eq!(client.get_status(&milestone_id), Symbol::new(&env, "Refunded"));
    assert_eq!(token.balance(&sponsor), 1000);
    assert_eq!(token.balance(&contract_id), 0);
}

#[test]
#[should_panic(expected = "Invalid status")]
fn test_double_fund_prevention() {
    let (_env, sponsor, builder, token_address, _token, token_admin, client, _contract_id) =
        setup_test_env();

    token_admin.mint(&sponsor, &2000);
    let milestone_id = 2;

    client.initialize_vault(&sponsor, &builder, &token_address, &500, &milestone_id);
    client.fund_vault(&milestone_id);
    // Should panic because already Funded
    client.fund_vault(&milestone_id);
}

#[test]
#[should_panic(expected = "Invalid status")]
fn test_double_release_prevention() {
    let (env, sponsor, builder, token_address, _token, token_admin, client, _contract_id) =
        setup_test_env();

    token_admin.mint(&sponsor, &1000);
    let milestone_id = 3;

    client.initialize_vault(&sponsor, &builder, &token_address, &500, &milestone_id);
    client.fund_vault(&milestone_id);
    client.submit_work(&milestone_id, &String::from_str(&env, "https://proof.io"));
    client.approve_and_release(&milestone_id);

    // Second release should panic
    client.approve_and_release(&milestone_id);
}

#[test]
#[should_panic(expected = "Invalid status")]
fn test_release_before_submit_fails() {
    let (_env, sponsor, builder, token_address, _token, token_admin, client, _contract_id) =
        setup_test_env();

    token_admin.mint(&sponsor, &1000);
    let milestone_id = 4;

    client.initialize_vault(&sponsor, &builder, &token_address, &500, &milestone_id);
    client.fund_vault(&milestone_id);
    // Attempt to release without submit_work
    client.approve_and_release(&milestone_id);
}

#[test]
#[should_panic(expected = "Amount must be positive")]
fn test_zero_amount_fails() {
    let (_env, sponsor, builder, token_address, _token, _token_admin, client, _contract_id) =
        setup_test_env();

    client.initialize_vault(&sponsor, &builder, &token_address, &0, &5);
}

#[test]
#[should_panic(expected = "Vault already initialized for this milestone_id")]
fn test_duplicate_milestone_id_fails() {
    let (_env, sponsor, builder, token_address, _token, _token_admin, client, _contract_id) =
        setup_test_env();

    client.initialize_vault(&sponsor, &builder, &token_address, &100, &6);
    client.initialize_vault(&sponsor, &builder, &token_address, &200, &6);
}

#[test]
#[should_panic(expected = "Vault not found")]
fn test_non_existent_vault_panics() {
    let (_env, _sponsor, _builder, _token_address, _token, _token_admin, client, _contract_id) =
        setup_test_env();

    client.fund_vault(&9999);
}

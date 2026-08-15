#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, token, Address, Env};

fn setup_test() -> (Env, VaultPayContractClient<'static>, Address, Address, token::Client<'static>, token::StellarAssetClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();

    let sponsor = Address::generate(&env);
    let builder = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_id = env.register_stellar_asset_contract(token_admin.clone());
    let token = token::Client::new(&env, &token_id);
    let token_admin_client = token::StellarAssetClient::new(&env, &token_id);

    token_admin_client.mint(&sponsor, &1000);

    let contract_id = env.register_contract(None, VaultPayContract);
    let client = VaultPayContractClient::new(&env, &contract_id);

    (env, client, sponsor, builder, token, token_admin_client)
}

#[test]
fn test_initialize_and_deposit_success() {
    let (env, client, sponsor, builder, token, _) = setup_test();

    env.mock_all_auths();
    client.initialize_escrow(&sponsor, &builder, &500, &token.address);
    client.deposit();

    assert_eq!(token.balance(&sponsor), 500);
    assert_eq!(token.balance(&client.address), 500);
}

#[test]
fn test_release_funds_success() {
    let (env, client, sponsor, builder, token, _) = setup_test();

    env.mock_all_auths();
    client.initialize_escrow(&sponsor, &builder, &500, &token.address);
    client.deposit();

    assert_eq!(token.balance(&builder), 0);
    client.release_funds();

    assert_eq!(token.balance(&builder), 500);
    assert_eq!(token.balance(&client.address), 0);
}

#![no_std]

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env};

#[contracttype]
pub enum DataKey {
    Sponsor,
    Builder,
    Amount,
    IsFunded,
    IsApproved,
    TokenId,
}

#[contract]
pub struct VaultPayContract;

#[contractimpl]
impl VaultPayContract {
    pub fn initialize_escrow(
        env: Env,
        sponsor: Address,
        builder: Address,
        amount: i128,
        token_id: Address,
    ) {
        sponsor.require_auth();
        env.storage().persistent().set(&DataKey::Sponsor, &sponsor);
        env.storage().persistent().set(&DataKey::Builder, &builder);
        env.storage().persistent().set(&DataKey::Amount, &amount);
        env.storage().persistent().set(&DataKey::TokenId, &token_id);
        env.storage().persistent().set(&DataKey::IsFunded, &false);
        env.storage().persistent().set(&DataKey::IsApproved, &false);
    }

    pub fn deposit(env: Env) {
        let sponsor: Address = env.storage().persistent().get(&DataKey::Sponsor).unwrap();
        sponsor.require_auth();

        let amount: i128 = env.storage().persistent().get(&DataKey::Amount).unwrap();
        let token_id: Address = env.storage().persistent().get(&DataKey::TokenId).unwrap();
        let is_funded: bool = env.storage().persistent().get(&DataKey::IsFunded).unwrap();

        if is_funded {
            panic!("Escrow is already funded");
        }

        let token = token::Client::new(&env, &token_id);
        token.transfer(&sponsor, &env.current_contract_address(), &amount);

        env.storage().persistent().set(&DataKey::IsFunded, &true);
    }

    pub fn release_funds(env: Env) {
        let sponsor: Address = env.storage().persistent().get(&DataKey::Sponsor).unwrap();
        sponsor.require_auth();

        let is_funded: bool = env.storage().persistent().get(&DataKey::IsFunded).unwrap();
        if !is_funded {
            panic!("Escrow is not funded");
        }

        let is_approved: bool = env
            .storage()
            .persistent()
            .get(&DataKey::IsApproved)
            .unwrap();
        if is_approved {
            panic!("Funds already released");
        }

        let builder: Address = env.storage().persistent().get(&DataKey::Builder).unwrap();
        let amount: i128 = env.storage().persistent().get(&DataKey::Amount).unwrap();
        let token_id: Address = env.storage().persistent().get(&DataKey::TokenId).unwrap();

        env.storage().persistent().set(&DataKey::IsApproved, &true);

        let token = token::Client::new(&env, &token_id);
        token.transfer(&env.current_contract_address(), &builder, &amount);
    }
}

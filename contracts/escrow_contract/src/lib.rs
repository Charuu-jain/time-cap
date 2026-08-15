#![no_std]

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Symbol};

#[contracttype]
pub enum DataKey {
    Sponsor,
    Builder,
    Token,
    Amount,
    MilestoneId,
    Status,
}

#[contract]
pub struct VaultPayContract;

#[contractimpl]
impl VaultPayContract {
    pub fn initialize_vault(
        env: Env,
        sponsor: Address,
        builder: Address,
        token: Address,
        amount: i128,
        milestone_id: u32,
    ) {
        sponsor.require_auth();
        env.storage().instance().set(&DataKey::Sponsor, &sponsor);
        env.storage().instance().set(&DataKey::Builder, &builder);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::MilestoneId, &milestone_id);
        env.storage().instance().set(&DataKey::Status, &Symbol::new(&env, "Created"));
    }

    pub fn fund_vault(env: Env, sponsor: Address) {
        sponsor.require_auth();
        let expected_sponsor: Address = env.storage().instance().get(&DataKey::Sponsor).unwrap();
        if sponsor != expected_sponsor {
            panic!("Unauthorized");
        }

        let status: Symbol = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Symbol::new(&env, "Created") {
            panic!("Invalid status");
        }

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&sponsor, &env.current_contract_address(), &amount);

        env.storage().instance().set(&DataKey::Status, &Symbol::new(&env, "Funded"));
    }

    pub fn submit_work(env: Env, builder: Address) {
        builder.require_auth();
        let expected_builder: Address = env.storage().instance().get(&DataKey::Builder).unwrap();
        if builder != expected_builder {
            panic!("Unauthorized");
        }

        let status: Symbol = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Symbol::new(&env, "Funded") {
            panic!("Invalid status");
        }

        env.storage().instance().set(&DataKey::Status, &Symbol::new(&env, "Submitted"));
    }

    pub fn approve_and_release(env: Env, sponsor: Address) {
        sponsor.require_auth();
        let expected_sponsor: Address = env.storage().instance().get(&DataKey::Sponsor).unwrap();
        if sponsor != expected_sponsor {
            panic!("Unauthorized");
        }

        let status: Symbol = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Symbol::new(&env, "Submitted") && status != Symbol::new(&env, "Funded") {
            panic!("Invalid status");
        }

        let builder: Address = env.storage().instance().get(&DataKey::Builder).unwrap();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &builder, &amount);

        env.storage().instance().set(&DataKey::Status, &Symbol::new(&env, "Released"));
    }

    pub fn refund(env: Env, sponsor: Address) {
        sponsor.require_auth();
        let expected_sponsor: Address = env.storage().instance().get(&DataKey::Sponsor).unwrap();
        if sponsor != expected_sponsor {
            panic!("Unauthorized");
        }

        let status: Symbol = env.storage().instance().get(&DataKey::Status).unwrap();
        if status != Symbol::new(&env, "Funded") && status != Symbol::new(&env, "Submitted") {
            panic!("Invalid status");
        }

        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &sponsor, &amount);

        env.storage().instance().set(&DataKey::Status, &Symbol::new(&env, "Created"));
    }

    pub fn get_status(env: Env) -> Symbol {
        env.storage().instance().get(&DataKey::Status).unwrap_or_else(|| Symbol::new(&env, "Created"))
    }
}

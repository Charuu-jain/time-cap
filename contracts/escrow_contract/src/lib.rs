#![no_std]

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, String, Symbol};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub struct Vault {
    pub sponsor: Address,
    pub builder: Address,
    pub token: Address,
    pub amount: i128,
    pub milestone_id: u32,
    pub deliverable_url: String,
    pub status: Symbol,
}

#[contracttype]
pub enum DataKey {
    Vault(u32),
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
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        if env.storage().persistent().has(&DataKey::Vault(milestone_id)) {
            panic!("Vault already initialized for this milestone_id");
        }

        let vault = Vault {
            sponsor,
            builder,
            token,
            amount,
            milestone_id,
            deliverable_url: String::from_str(&env, ""),
            status: Symbol::new(&env, "Created"),
        };

        env.storage().persistent().set(&DataKey::Vault(milestone_id), &vault);
    }

    pub fn fund_vault(env: Env, milestone_id: u32) {
        let mut vault: Vault = env
            .storage()
            .persistent()
            .get(&DataKey::Vault(milestone_id))
            .unwrap_or_else(|| panic!("Vault not found"));

        vault.sponsor.require_auth();

        if vault.status != Symbol::new(&env, "Created") {
            panic!("Invalid status");
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(&vault.sponsor, &env.current_contract_address(), &vault.amount);

        vault.status = Symbol::new(&env, "Funded");
        env.storage().persistent().set(&DataKey::Vault(milestone_id), &vault);
    }

    pub fn submit_work(env: Env, milestone_id: u32, deliverable_url: String) {
        let mut vault: Vault = env
            .storage()
            .persistent()
            .get(&DataKey::Vault(milestone_id))
            .unwrap_or_else(|| panic!("Vault not found"));

        vault.builder.require_auth();

        if vault.status != Symbol::new(&env, "Funded") {
            panic!("Invalid status");
        }

        vault.deliverable_url = deliverable_url;
        vault.status = Symbol::new(&env, "Submitted");
        env.storage().persistent().set(&DataKey::Vault(milestone_id), &vault);
    }

    pub fn approve_and_release(env: Env, milestone_id: u32) {
        let mut vault: Vault = env
            .storage()
            .persistent()
            .get(&DataKey::Vault(milestone_id))
            .unwrap_or_else(|| panic!("Vault not found"));

        vault.sponsor.require_auth();

        if vault.status != Symbol::new(&env, "Submitted") {
            panic!("Invalid status");
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(&env.current_contract_address(), &vault.builder, &vault.amount);

        vault.status = Symbol::new(&env, "Released");
        env.storage().persistent().set(&DataKey::Vault(milestone_id), &vault);
    }

    pub fn refund(env: Env, milestone_id: u32) {
        let mut vault: Vault = env
            .storage()
            .persistent()
            .get(&DataKey::Vault(milestone_id))
            .unwrap_or_else(|| panic!("Vault not found"));

        vault.sponsor.require_auth();

        if vault.status != Symbol::new(&env, "Funded") && vault.status != Symbol::new(&env, "Submitted") {
            panic!("Invalid status");
        }

        let token_client = token::Client::new(&env, &vault.token);
        token_client.transfer(&env.current_contract_address(), &vault.sponsor, &vault.amount);

        vault.status = Symbol::new(&env, "Refunded");
        env.storage().persistent().set(&DataKey::Vault(milestone_id), &vault);
    }

    pub fn get_status(env: Env, milestone_id: u32) -> Symbol {
        let vault: Vault = env
            .storage()
            .persistent()
            .get(&DataKey::Vault(milestone_id))
            .unwrap_or_else(|| panic!("Vault not found"));
        vault.status
    }

    pub fn get_vault(env: Env, milestone_id: u32) -> Vault {
        env.storage()
            .persistent()
            .get(&DataKey::Vault(milestone_id))
            .unwrap_or_else(|| panic!("Vault not found"))
    }
}

#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    BountyCreator(BytesN<32>),
}

#[contract]
pub struct RegistryContract;

#[contractimpl]
impl RegistryContract {
    /// Log a bounty entry with its ID and creator address
    pub fn log_bounty(env: Env, bounty_id: BytesN<32>, creator: Address) {
        env.storage()
            .persistent()
            .set(&DataKey::BountyCreator(bounty_id), &creator);
    }

    /// Retrieve logged creator for a given bounty_id
    pub fn get_creator(env: Env, bounty_id: BytesN<32>) -> Option<Address> {
        env.storage()
            .persistent()
            .get(&DataKey::BountyCreator(bounty_id))
    }
}

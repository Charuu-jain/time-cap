#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, token, Address, BytesN, Env, String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    AlreadyClaimed = 2,
    IncorrectSolution = 3,
    NotInitialized = 4,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    BountyHash,
    BountyCreator,
    BountyAmount,
    Claimed,
    TokenAddress,
}

#[contract]
pub struct BountyBoxContract;

#[contractimpl]
impl BountyBoxContract {
    /// Initialize contract with a secret hash, bounty amount, token address, and creator.
    pub fn create_bounty(
        env: Env,
        token: Address,
        creator: Address,
        secret_hash: BytesN<32>,
        amount: i128,
    ) -> Result<(), Error> {
        creator.require_auth();

        if env.storage().instance().has(&DataKey::BountyCreator) {
            return Err(Error::AlreadyInitialized);
        }

        // Transfer funds from creator to the contract address
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        env.storage().instance().set(&DataKey::BountyHash, &secret_hash);
        env.storage().instance().set(&DataKey::BountyCreator, &creator);
        env.storage().instance().set(&DataKey::BountyAmount, &amount);
        env.storage().instance().set(&DataKey::TokenAddress, &token);
        env.storage().instance().set(&DataKey::Claimed, &false);

        // Extend TTL
        env.storage().instance().extend_ttl(100000, 100000);

        Ok(())
    }

    /// Claim bounty by submitting the plain string password
    pub fn claim_bounty(env: Env, solver: Address, solution_str: String) -> Result<bool, Error> {
        solver.require_auth();

        if !env.storage().instance().has(&DataKey::BountyCreator) {
            return Err(Error::NotInitialized);
        }

        let is_claimed: bool = env
            .storage()
            .instance()
            .get(&DataKey::Claimed)
            .unwrap_or(false);

        if is_claimed {
            return Err(Error::AlreadyClaimed);
        }

        let stored_hash: BytesN<32> = env
            .storage()
            .instance()
            .get(&DataKey::BountyHash)
            .unwrap();

        let len = solution_str.len() as usize;
        if len > 256 {
            return Err(Error::IncorrectSolution);
        }
        
        let mut slice_buf = [0u8; 256];
        solution_str.copy_into_slice(&mut slice_buf[..len]);

        let computed_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len])).into();

        if computed_hash != stored_hash {
            panic!("Incorrect solution");
        }

        let amount: i128 = env
            .storage()
            .instance()
            .get(&DataKey::BountyAmount)
            .unwrap();
            
        let token: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenAddress)
            .unwrap();

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&env.current_contract_address(), &solver, &amount);

        env.storage().instance().set(&DataKey::Claimed, &true);

        Ok(true)
    }

    /// Get contract bounty status details
    pub fn get_bounty_info(env: Env) -> (Address, i128, bool, BytesN<32>) {
        let creator: Address = env.storage().instance().get(&DataKey::BountyCreator).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::BountyAmount).unwrap();
        let claimed: bool = env.storage().instance().get(&DataKey::Claimed).unwrap_or(false);
        let hash: BytesN<32> = env.storage().instance().get(&DataKey::BountyHash).unwrap();

        (creator, amount, claimed, hash)
    }
}

#[cfg(test)]
mod test;

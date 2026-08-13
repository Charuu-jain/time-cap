#![no_std]
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, symbol_short, token, Address, BytesN, Env, String,
};

// Define registry client for cross-contract calls
#[contractclient(name = "RegistryClient")]
pub trait RegistryInterface {
    fn log_bounty(env: Env, bounty_id: BytesN<32>, creator: Address);
}

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
pub struct BountyDetails {
    pub creator: Address,
    pub amount: i128,
    pub claimed: bool,
    pub token: Address,
    pub registry_id: Address,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Bounty(BytesN<32>),
}

#[contract]
pub struct BountyBoxContract;

#[contractimpl]
impl BountyBoxContract {
    /// Create a bounty vault with a secret hash, bounty amount, token address, creator, and registry_id for cross-contract logging.
    pub fn create_bounty(
        env: Env,
        token: Address,
        creator: Address,
        secret_hash: BytesN<32>,
        amount: i128,
        registry_id: Address,
    ) -> Result<(), Error> {
        creator.require_auth();

        if env.storage().persistent().has(&DataKey::Bounty(secret_hash.clone())) {
            return Err(Error::AlreadyInitialized);
        }

        // Transfer funds from creator to the contract address
        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&creator, &env.current_contract_address(), &amount);

        // Perform Cross-Contract Call to Registry Contract
        let registry_client = RegistryClient::new(&env, &registry_id);
        registry_client.log_bounty(&secret_hash, &creator);

        // Emit Created event
        env.events().publish((symbol_short!("Created"), creator.clone()), amount);

        let details = BountyDetails {
            creator,
            amount,
            claimed: false,
            token,
            registry_id,
        };

        env.storage().persistent().set(&DataKey::Bounty(secret_hash.clone()), &details);
        env.storage().persistent().extend_ttl(&DataKey::Bounty(secret_hash), 100000, 100000);

        Ok(())
    }

    /// Claim bounty by submitting the plain string password
    pub fn claim_bounty(env: Env, solver: Address, solution_str: String) -> Result<bool, Error> {
        solver.require_auth();

        let len = solution_str.len() as usize;
        if len > 256 {
            return Err(Error::IncorrectSolution);
        }
        
        let mut slice_buf = [0u8; 256];
        solution_str.copy_into_slice(&mut slice_buf[..len]);

        let computed_hash: BytesN<32> = env.crypto().sha256(&soroban_sdk::Bytes::from_slice(&env, &slice_buf[..len])).into();

        let bounty_key = DataKey::Bounty(computed_hash.clone());
        if !env.storage().persistent().has(&bounty_key) {
            panic!("Incorrect solution");
        }
        let mut details: BountyDetails = env
            .storage()
            .persistent()
            .get(&bounty_key)
            .unwrap();

        if details.claimed {
            return Err(Error::AlreadyClaimed);
        }

        let token_client = token::Client::new(&env, &details.token);
        token_client.transfer(&env.current_contract_address(), &solver, &details.amount);

        // Emit Claimed event
        env.events().publish((symbol_short!("Claimed"), solver.clone()), details.amount);

        details.claimed = true;
        env.storage().persistent().set(&bounty_key, &details);
        env.storage().persistent().extend_ttl(&bounty_key, 100000, 100000);

        Ok(true)
    }

    /// Get contract bounty status details by secret hash
    pub fn get_bounty_info(env: Env, secret_hash: BytesN<32>) -> (Address, i128, bool, BytesN<32>) {
        let bounty_key = DataKey::Bounty(secret_hash.clone());
        let details: BountyDetails = env.storage().persistent().get(&bounty_key).unwrap();
        (details.creator, details.amount, details.claimed, secret_hash)
    }
}

#[cfg(test)]
mod test;

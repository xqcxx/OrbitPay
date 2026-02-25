#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, token, Address, Env, Symbol, Vec};

mod errors;
mod storage;
mod types;

use errors::TreasuryError;
use storage::{
    get_admin, get_proposal_count, get_signers, get_threshold, get_withdrawal, has_admin,
    set_admin, set_proposal_count, set_signers, set_threshold, set_withdrawal,
    extend_instance_ttl, extend_withdrawal_ttl,
};
use types::{TreasuryConfig, WithdrawalRequest, WithdrawalStatus};

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
    /// Internal helper to ensure the contract has been initialized.
    fn require_initialized(env: &Env) -> Result<(), TreasuryError> {
        if !has_admin(env) {
            return Err(TreasuryError::NotInitialized);
        }
        Ok(())
    }

    /// Initialize the treasury with an admin and initial set of signers.
    /// The threshold defines how many signers must approve a withdrawal.
    pub fn initialize(
        env: Env,
        admin: Address,
        signers: Vec<Address>,
        threshold: u32,
    ) -> Result<(), TreasuryError> {
        if has_admin(&env) {
            return Err(TreasuryError::AlreadyInitialized);
        }
        if threshold == 0 || threshold > signers.len() {
            return Err(TreasuryError::InvalidThreshold);
        }

        admin.require_auth();

        set_admin(&env, &admin);
        set_signers(&env, &signers);
        set_threshold(&env, threshold);
        set_proposal_count(&env, 0);

        extend_instance_ttl(&env);

        env.events()
            .publish((symbol_short!("init"),), admin.clone());

        Ok(())
    }

    /// Deposit native tokens into the treasury.
    /// Any address can deposit funds into the treasury vault.
    pub fn deposit(
        env: Env,
        from: Address,
        _token: Address,
        amount: i128,
    ) -> Result<(), TreasuryError> {
        Self::require_initialized(&env)?;
        if amount <= 0 {
            return Err(TreasuryError::InvalidAmount);
        }

        from.require_auth();

        // Transfer tokens from depositor to this contract
        let _contract_address = env.current_contract_address();
        // TODO: Invoke token contract transfer (contributor task SC-4)
        // token::Client::new(&env, &token).transfer(&from, &contract_address, &amount);

        env.events()
            .publish((symbol_short!("deposit"), from.clone()), amount);

        Ok(())
    }

    /// Create a withdrawal request that requires multi-sig approval.
    /// Only existing signers can create withdrawal requests.
    pub fn create_withdrawal(
        env: Env,
        proposer: Address,
        token: Address,
        recipient: Address,
        amount: i128,
        memo: Symbol,
    ) -> Result<u32, TreasuryError> {
        Self::require_initialized(&env)?;
        proposer.require_auth();

        let signers = get_signers(&env);
        let mut is_signer = false;
        for i in 0..signers.len() {
            if signers.get(i).unwrap() == proposer {
                is_signer = true;
                break;
            }
        }
        if !is_signer {
            return Err(TreasuryError::NotASigner);
        }
        if amount <= 0 {
            return Err(TreasuryError::InvalidAmount);
        }

        let proposal_id = get_proposal_count(&env);
        let mut approvals = Vec::new(&env);
        approvals.push_back(proposer.clone());

        let request = WithdrawalRequest {
            id: proposal_id,
            proposer: proposer.clone(),
            token,
            recipient,
            amount,
            memo,
            approvals,
            status: WithdrawalStatus::Pending,
            created_at: env.ledger().timestamp(),
        };

        set_withdrawal(&env, proposal_id, &request);
        set_proposal_count(&env, proposal_id + 1);

        extend_instance_ttl(&env);
        extend_withdrawal_ttl(&env, proposal_id);

        env.events()
            .publish((symbol_short!("w_create"), proposer.clone()), proposal_id);

        Ok(proposal_id)
    }

    /// Approve a pending withdrawal request.
    /// Only signers can approve. Once threshold is met, the withdrawal is marked as approved.
    pub fn approve_withdrawal(
        env: Env,
        signer: Address,
        proposal_id: u32,
    ) -> Result<(), TreasuryError> {
        Self::require_initialized(&env)?;
        signer.require_auth();

        // Verify signer is authorized
        let signers = get_signers(&env);
        let mut is_signer = false;
        for i in 0..signers.len() {
            if signers.get(i).unwrap() == signer {
                is_signer = true;
                break;
            }
        }
        if !is_signer {
            return Err(TreasuryError::NotASigner);
        }

        let mut request =
            get_withdrawal(&env, proposal_id).ok_or(TreasuryError::ProposalNotFound)?;

        if request.status != WithdrawalStatus::Pending {
            return Err(TreasuryError::ProposalNotPending);
        }

        // Check if already approved by this signer
        for i in 0..request.approvals.len() {
            if request.approvals.get(i).unwrap() == signer {
                return Err(TreasuryError::AlreadyApproved);
            }
        }

        request.approvals.push_back(signer.clone());

        // Check if threshold is met
        let threshold = get_threshold(&env);
        if request.approvals.len() >= threshold {
            request.status = WithdrawalStatus::Approved;
        }

        set_withdrawal(&env, proposal_id, &request);

        extend_withdrawal_ttl(&env, proposal_id);

        env.events()
            .publish((symbol_short!("approve"), signer.clone()), proposal_id);

        Ok(())
    }

    /// Execute an approved withdrawal — transfers funds to recipient.
    /// Can only be called after threshold approvals are met.
    pub fn execute_withdrawal(
        env: Env,
        executor: Address,
        proposal_id: u32,
    ) -> Result<(), TreasuryError> {
        Self::require_initialized(&env)?;
        executor.require_auth();

        let mut request =
            get_withdrawal(&env, proposal_id).ok_or(TreasuryError::ProposalNotFound)?;

        if request.status != WithdrawalStatus::Approved {
            return Err(TreasuryError::ProposalNotApproved);
        }

        let contract_address = env.current_contract_address();
        let token_client = token::Client::new(&env, &request.token);

        let contract_balance = token_client.balance(&contract_address);
        if contract_balance < request.amount {
            return Err(TreasuryError::InsufficientBalance);
        }

        token_client.transfer(&contract_address, &request.recipient, &request.amount);

        request.status = WithdrawalStatus::Executed;
        set_withdrawal(&env, proposal_id, &request);

        extend_withdrawal_ttl(&env, proposal_id);

        env.events().publish(
            (symbol_short!("w_exec"), request.recipient.clone()),
            request.amount,
        );

        Ok(())
    }

    /// Add a new signer to the treasury. Restricted to admin.
    pub fn add_signer(env: Env, admin: Address, new_signer: Address) -> Result<(), TreasuryError> {
        Self::require_initialized(&env)?;
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(TreasuryError::Unauthorized);
        }
        admin.require_auth();

        let mut signers = get_signers(&env);
        for i in 0..signers.len() {
            if signers.get(i).unwrap() == new_signer {
                return Err(TreasuryError::AlreadyASigner);
            }
        }
        signers.push_back(new_signer.clone());
        set_signers(&env, &signers);

        extend_instance_ttl(&env);

        env.events().publish((symbol_short!("s_add"),), new_signer);

        Ok(())
    }

    /// Remove a signer from the treasury. Restricted to admin.
    /// Cannot remove if it would make threshold unachievable.
    pub fn remove_signer(env: Env, admin: Address, signer: Address) -> Result<(), TreasuryError> {
        Self::require_initialized(&env)?;
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(TreasuryError::Unauthorized);
        }
        admin.require_auth();

        let signers = get_signers(&env);
        let threshold = get_threshold(&env);

        if signers.len() <= threshold {
            return Err(TreasuryError::InvalidThreshold);
        }

        let mut new_signers = Vec::new(&env);
        let mut found = false;
        for i in 0..signers.len() {
            let s = signers.get(i).unwrap();
            if s == signer {
                found = true;
            } else {
                new_signers.push_back(s);
            }
        }

        if !found {
            return Err(TreasuryError::NotASigner);
        }

        set_signers(&env, &new_signers);

        extend_instance_ttl(&env);

        env.events().publish((symbol_short!("s_remove"),), signer);

        Ok(())
    }

    /// Update the approval threshold. Restricted to admin.
    pub fn update_threshold(
        env: Env,
        admin: Address,
        new_threshold: u32,
    ) -> Result<(), TreasuryError> {
        Self::require_initialized(&env)?;
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(TreasuryError::Unauthorized);
        }
        admin.require_auth();

        let signers = get_signers(&env);
        if new_threshold == 0 || new_threshold > signers.len() {
            return Err(TreasuryError::InvalidThreshold);
        }

        set_threshold(&env, new_threshold);

        extend_instance_ttl(&env);

        env.events()
            .publish((symbol_short!("t_upd"),), new_threshold);

        Ok(())
    }

    // ── Query Functions ──────────────────────────────────────────────

    /// Get the current admin address.
    pub fn get_admin(env: Env) -> Result<Address, TreasuryError> {
        Self::require_initialized(&env)?;
        Ok(get_admin(&env))
    }

    /// Get the list of current signers.
    pub fn get_signers(env: Env) -> Result<Vec<Address>, TreasuryError> {
        Self::require_initialized(&env)?;
        Ok(get_signers(&env))
    }

    /// Get the current approval threshold.
    pub fn get_threshold(env: Env) -> Result<u32, TreasuryError> {
        Self::require_initialized(&env)?;
        Ok(get_threshold(&env))
    }

    /// Get a specific withdrawal request by ID.
    pub fn get_withdrawal(env: Env, proposal_id: u32) -> Result<WithdrawalRequest, TreasuryError> {
        get_withdrawal(&env, proposal_id).ok_or(TreasuryError::ProposalNotFound)
    }

    /// Get the total number of withdrawal proposals created.
    pub fn get_proposal_count(env: Env) -> Result<u32, TreasuryError> {
        Self::require_initialized(&env)?;
        Ok(get_proposal_count(&env))
    }

    /// Get the full treasury configuration snapshot.
    pub fn get_config(env: Env) -> Result<TreasuryConfig, TreasuryError> {
        Self::require_initialized(&env)?;
        Ok(TreasuryConfig {
            admin: get_admin(&env),
            signers: get_signers(&env),
            threshold: get_threshold(&env),
            proposal_count: get_proposal_count(&env),
        })
    }

    /// Upgrade the contract WASM. Restricted to admin.
    pub fn upgrade(
        env: Env,
        admin: Address,
        new_wasm_hash: soroban_sdk::BytesN<32>,
    ) -> Result<(), TreasuryError> {
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(TreasuryError::Unauthorized);
        }
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}

mod test;

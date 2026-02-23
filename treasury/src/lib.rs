#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, Vec};

mod errors;
mod storage;
mod types;

use errors::TreasuryError;
use storage::{
    get_admin, get_proposal_count, get_signers, get_threshold, get_withdrawal, has_admin,
    set_admin, set_proposal_count, set_signers, set_threshold, set_withdrawal,
};
use types::{
    SignerAddedEvent, SignerRemovedEvent, ThresholdUpdatedEvent, TreasuryDepositEvent,
    TreasuryInitializedEvent, WithdrawalApprovedEvent, WithdrawalCancelledEvent,
    WithdrawalCreatedEvent, WithdrawalExecutedEvent, WithdrawalRequest, WithdrawalStatus,
};

#[contract]
pub struct TreasuryContract;

#[contractimpl]
impl TreasuryContract {
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

        env.events().publish(
            (symbol_short!("TreasuryDeposit"),),
            TreasuryDepositEvent {
                depositor: from.clone(),
                token: _token,
                amount,
            },
        );

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
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
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
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
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

        env.events().publish(
            (symbol_short!("WithdrawalCreated"),),
            WithdrawalCreatedEvent {
                proposal_id,
                proposer: proposer.clone(),
                token,
                recipient,
                amount,
                memo,
            },
        );

        Ok(proposal_id)
    }

    /// Approve a pending withdrawal request.
    /// Only signers can approve. Once threshold is met, the withdrawal is marked as approved.
    pub fn approve_withdrawal(
        env: Env,
        signer: Address,
        proposal_id: u32,
    ) -> Result<(), TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
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

        let threshold = get_threshold(&env);
        let approval_count = request.approvals.len();

        if approval_count >= threshold {
            request.status = WithdrawalStatus::Approved;
        }

        set_withdrawal(&env, proposal_id, &request);

        env.events().publish(
            (symbol_short!("WithdrawalApproved"),),
            WithdrawalApprovedEvent {
                proposal_id,
                signer: signer.clone(),
                approval_count,
                threshold,
            },
        );

        Ok(())
    }

    /// Execute an approved withdrawal — transfers funds to recipient.
    /// Can only be called after threshold approvals are met.
    pub fn execute_withdrawal(
        env: Env,
        executor: Address,
        proposal_id: u32,
    ) -> Result<(), TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
        executor.require_auth();

        let mut request =
            get_withdrawal(&env, proposal_id).ok_or(TreasuryError::ProposalNotFound)?;

        if request.status != WithdrawalStatus::Approved {
            return Err(TreasuryError::ProposalNotApproved);
        }

        // TODO: Execute token transfer (contributor task SC-5)
        // token::Client::new(&env, &request.token)
        //     .transfer(&env.current_contract_address(), &request.recipient, &request.amount);

        let recipient = request.recipient.clone();
        let token = request.token.clone();
        let amount = request.amount;

        request.status = WithdrawalStatus::Executed;
        set_withdrawal(&env, proposal_id, &request);

        env.events().publish(
            (symbol_short!("WithdrawalExecuted"),),
            WithdrawalExecutedEvent {
                proposal_id,
                recipient,
                token,
                amount,
            },
        );

        Ok(())
    }

    /// Cancel a pending withdrawal request.
    /// Only the original proposer or the admin can cancel.
    /// Can only cancel requests in 'Pending' status.
    pub fn cancel_withdrawal(
        env: Env,
        caller: Address,
        proposal_id: u32,
    ) -> Result<(), TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }

        caller.require_auth();

        let mut request =
            get_withdrawal(&env, proposal_id).ok_or(TreasuryError::ProposalNotFound)?;

        let admin = get_admin(&env);
        if caller != request.proposer && caller != admin {
            return Err(TreasuryError::Unauthorized);
        }

        if request.status != WithdrawalStatus::Pending {
            return Err(TreasuryError::ProposalNotPending);
        }

        request.status = WithdrawalStatus::Cancelled;
        set_withdrawal(&env, proposal_id, &request);

        env.events().publish(
            (symbol_short!("WithdrawalCancelled"),),
            WithdrawalCancelledEvent {
                proposal_id,
                caller: caller.clone(),
            },
        );

        Ok(())
    }

    /// Add a new signer to the treasury. Restricted to admin.
    pub fn add_signer(env: Env, admin: Address, new_signer: Address) -> Result<(), TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
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

        env.events().publish(
            (symbol_short!("SignerAdded"),),
            SignerAddedEvent { new_signer },
        );

        Ok(())
    }

    /// Remove a signer from the treasury. Restricted to admin.
    /// Cannot remove if it would make threshold unachievable.
    pub fn remove_signer(env: Env, admin: Address, signer: Address) -> Result<(), TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
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

        env.events().publish(
            (symbol_short!("SignerRemoved"),),
            SignerRemovedEvent {
                removed_signer: signer,
            },
        );

        Ok(())
    }

    /// Update the approval threshold. Restricted to admin.
    pub fn update_threshold(
        env: Env,
        admin: Address,
        new_threshold: u32,
    ) -> Result<(), TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(TreasuryError::Unauthorized);
        }
        admin.require_auth();

        let signers = get_signers(&env);
        if new_threshold == 0 || new_threshold > signers.len() {
            return Err(TreasuryError::InvalidThreshold);
        }

        let old_threshold = get_threshold(&env);

        set_threshold(&env, new_threshold);

        env.events().publish(
            (symbol_short!("ThresholdUpdated"),),
            ThresholdUpdatedEvent {
                old_threshold,
                new_threshold,
            },
        );

        Ok(())
    }

    // ── Query Functions ──────────────────────────────────────────────

    /// Get the current admin address.
    pub fn get_admin(env: Env) -> Result<Address, TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
        Ok(get_admin(&env))
    }

    /// Get the list of current signers.
    pub fn get_signers(env: Env) -> Result<Vec<Address>, TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
        Ok(get_signers(&env))
    }

    /// Get the current approval threshold.
    pub fn get_threshold(env: Env) -> Result<u32, TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
        Ok(get_threshold(&env))
    }

    /// Get a specific withdrawal request by ID.
    pub fn get_withdrawal(env: Env, proposal_id: u32) -> Result<WithdrawalRequest, TreasuryError> {
        get_withdrawal(&env, proposal_id).ok_or(TreasuryError::ProposalNotFound)
    }

    /// Get the total number of withdrawal proposals created.
    pub fn get_proposal_count(env: Env) -> Result<u32, TreasuryError> {
        if !has_admin(&env) {
            return Err(TreasuryError::NotInitialized);
        }
        Ok(get_proposal_count(&env))
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

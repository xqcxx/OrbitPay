#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, symbol_short};

mod errors;
mod storage;
mod types;

use errors::GovernanceError;
use storage::{
    get_admin, has_admin, set_admin, get_members, set_members, is_member,
    get_proposal_count, set_proposal_count, get_proposal, set_proposal,
    get_quorum_percentage, set_quorum_percentage, get_voting_duration, set_voting_duration,
};
use types::{Proposal, ProposalStatus, VoteChoice, VoteRecord, GovernanceConfig};

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    /// Initialize the governance contract.
    ///
    /// # Arguments
    /// * `admin` - The DAO admin
    /// * `members` - Initial list of DAO members who can vote
    /// * `quorum_percentage` - Minimum % of members that must vote (0-100)
    /// * `voting_duration` - Duration of voting window in seconds
    pub fn initialize(
        env: Env,
        admin: Address,
        members: Vec<Address>,
        quorum_percentage: u32,
        voting_duration: u64,
    ) -> Result<(), GovernanceError> {
        if has_admin(&env) {
            return Err(GovernanceError::AlreadyInitialized);
        }
        admin.require_auth();

        set_admin(&env, &admin);
        set_members(&env, &members);
        set_quorum_percentage(&env, quorum_percentage);
        set_voting_duration(&env, voting_duration);
        set_proposal_count(&env, 0);

        env.events().publish(
            (symbol_short!("init"),),
            admin.clone(),
        );

        Ok(())
    }

    /// Create a new budget proposal.
    /// Only DAO members can submit proposals.
    pub fn create_proposal(
        env: Env,
        proposer: Address,
        title: Symbol,
        token: Address,
        amount: i128,
        recipient: Address,
    ) -> Result<u32, GovernanceError> {
        if !has_admin(&env) {
            return Err(GovernanceError::NotInitialized);
        }
        proposer.require_auth();

        if !is_member(&env, &proposer) {
            return Err(GovernanceError::NotAMember);
        }
        if amount <= 0 {
            return Err(GovernanceError::InvalidAmount);
        }

        let proposal_id = get_proposal_count(&env);
        let now = env.ledger().timestamp();
        let voting_duration = get_voting_duration(&env);

        let proposal = Proposal {
            id: proposal_id,
            proposer: proposer.clone(),
            title,
            token,
            amount,
            recipient,
            yes_votes: 0,
            no_votes: 0,
            abstain_votes: 0,
            votes: Vec::new(&env),
            status: ProposalStatus::Active,
            start_time: now,
            end_time: now + voting_duration,
        };

        set_proposal(&env, proposal_id, &proposal);
        set_proposal_count(&env, proposal_id + 1);

        env.events().publish(
            (symbol_short!("p_create"), proposer.clone()),
            proposal_id,
        );

        Ok(proposal_id)
    }

    /// Cast a vote on an active proposal.
    /// Each member can only vote once per proposal.
    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: u32,
        choice: VoteChoice,
    ) -> Result<(), GovernanceError> {
        if !has_admin(&env) {
            return Err(GovernanceError::NotInitialized);
        }
        voter.require_auth();

        if !is_member(&env, &voter) {
            return Err(GovernanceError::NotAMember);
        }

        let mut proposal = get_proposal(&env, proposal_id)
            .ok_or(GovernanceError::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Active {
            return Err(GovernanceError::VotingNotActive);
        }

        let now = env.ledger().timestamp();
        if now > proposal.end_time {
            return Err(GovernanceError::VotingPeriodExpired);
        }

        // Check for duplicate votes
        for i in 0..proposal.votes.len() {
            let record = proposal.votes.get(i).unwrap();
            if record.voter == voter {
                return Err(GovernanceError::AlreadyVoted);
            }
        }

        // Record the vote
        match choice {
            VoteChoice::Yes => proposal.yes_votes += 1,
            VoteChoice::No => proposal.no_votes += 1,
            VoteChoice::Abstain => proposal.abstain_votes += 1,
        }

        proposal.votes.push_back(VoteRecord {
            voter: voter.clone(),
            choice: choice.clone(),
            timestamp: now,
        });

        set_proposal(&env, proposal_id, &proposal);

        env.events().publish(
            (symbol_short!("vote"), voter.clone()),
            proposal_id,
        );

        Ok(())
    }

    /// Finalize a proposal after the voting period has ended.
    /// Checks quorum and majority to determine if the proposal passes.
    pub fn finalize(
        env: Env,
        caller: Address,
        proposal_id: u32,
    ) -> Result<ProposalStatus, GovernanceError> {
        if !has_admin(&env) {
            return Err(GovernanceError::NotInitialized);
        }
        caller.require_auth();

        let mut proposal = get_proposal(&env, proposal_id)
            .ok_or(GovernanceError::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Active {
            return Err(GovernanceError::VotingNotActive);
        }

        let now = env.ledger().timestamp();
        if now <= proposal.end_time {
            return Err(GovernanceError::ProposalStillActive);
        }

        let members = get_members(&env);
        let quorum_pct = get_quorum_percentage(&env);
        let total_votes = proposal.yes_votes + proposal.no_votes + proposal.abstain_votes;

        // Check quorum: enough members voted?
        let quorum_threshold = (members.len() * quorum_pct) / 100;
        if total_votes < quorum_threshold {
            proposal.status = ProposalStatus::Rejected;
            set_proposal(&env, proposal_id, &proposal);
            return Ok(ProposalStatus::Rejected);
        }

        // Check majority: more yes than no?
        if proposal.yes_votes > proposal.no_votes {
            proposal.status = ProposalStatus::Approved;
        } else {
            proposal.status = ProposalStatus::Rejected;
        }

        set_proposal(&env, proposal_id, &proposal);

        env.events().publish(
            (symbol_short!("finalize"),),
            proposal.status.clone(),
        );

        Ok(proposal.status)
    }

    /// Execute an approved proposal — disburse funds to the recipient.
    /// Can only be called by the admin after the proposal is finalized and approved.
    pub fn execute(
        env: Env,
        admin: Address,
        proposal_id: u32,
    ) -> Result<(), GovernanceError> {
        if !has_admin(&env) {
            return Err(GovernanceError::NotInitialized);
        }
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(GovernanceError::Unauthorized);
        }
        admin.require_auth();

        let mut proposal = get_proposal(&env, proposal_id)
            .ok_or(GovernanceError::ProposalNotFound)?;

        if proposal.status != ProposalStatus::Approved {
            return Err(GovernanceError::ProposalNotApproved);
        }

        // TODO: Transfer funds from treasury to recipient (contributor task SC-24)
        // token::Client::new(&env, &proposal.token)
        //     .transfer(&env.current_contract_address(), &proposal.recipient, &proposal.amount);

        proposal.status = ProposalStatus::Executed;
        set_proposal(&env, proposal_id, &proposal);

        env.events().publish(
            (symbol_short!("execute"),),
            proposal_id,
        );

        Ok(())
    }

    /// Add a new member to the DAO. Restricted to admin.
    pub fn add_member(env: Env, admin: Address, new_member: Address) -> Result<(), GovernanceError> {
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(GovernanceError::Unauthorized);
        }
        admin.require_auth();

        let mut members = get_members(&env);
        if is_member(&env, &new_member) {
            return Err(GovernanceError::AlreadyVoted); // Reuse: already exists
        }
        members.push_back(new_member.clone());
        set_members(&env, &members);

        env.events().publish(
            (symbol_short!("m_add"),),
            new_member,
        );

        Ok(())
    }

    /// Remove a member from the DAO. Restricted to admin.
    pub fn remove_member(env: Env, admin: Address, member: Address) -> Result<(), GovernanceError> {
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(GovernanceError::Unauthorized);
        }
        admin.require_auth();

        let members = get_members(&env);
        let mut new_members = Vec::new(&env);
        let mut found = false;
        for i in 0..members.len() {
            let m = members.get(i).unwrap();
            if m == member {
                found = true;
            } else {
                new_members.push_back(m);
            }
        }

        if !found {
            return Err(GovernanceError::NotAMember);
        }

        set_members(&env, &new_members);

        env.events().publish(
            (symbol_short!("m_remove"),),
            member,
        );

        Ok(())
    }

    // ── Query Functions ──────────────────────────────────────────

    /// Get a specific proposal.
    pub fn get_proposal(env: Env, proposal_id: u32) -> Result<Proposal, GovernanceError> {
        get_proposal(&env, proposal_id).ok_or(GovernanceError::ProposalNotFound)
    }

    /// Get the total number of proposals.
    pub fn get_proposal_count(env: Env) -> u32 {
        get_proposal_count(&env)
    }

    /// Get the list of DAO members.
    pub fn get_members(env: Env) -> Vec<Address> {
        get_members(&env)
    }

    /// Get the governance configuration.
    pub fn get_config(env: Env) -> Result<GovernanceConfig, GovernanceError> {
        if !has_admin(&env) {
            return Err(GovernanceError::NotInitialized);
        }
        let members = get_members(&env);
        Ok(GovernanceConfig {
            quorum_percentage: get_quorum_percentage(&env),
            voting_duration: get_voting_duration(&env),
            member_count: members.len(),
        })
    }

    /// Get the admin address.
    pub fn get_admin(env: Env) -> Result<Address, GovernanceError> {
        if !has_admin(&env) {
            return Err(GovernanceError::NotInitialized);
        }
        Ok(get_admin(&env))
    }

    /// Upgrade the contract WASM. Restricted to admin.
    pub fn upgrade(env: Env, admin: Address, new_wasm_hash: soroban_sdk::BytesN<32>) -> Result<(), GovernanceError> {
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(GovernanceError::Unauthorized);
        }
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}

mod test;

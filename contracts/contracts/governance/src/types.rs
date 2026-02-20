use soroban_sdk::{contracttype, Address, Symbol, Vec};

/// Status of a budget proposal.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProposalStatus {
    /// The proposal is open for voting.
    Active,
    /// The proposal passed (met quorum and majority voted yes).
    Approved,
    /// The proposal failed (did not meet quorum or majority voted no).
    Rejected,
    /// The approved proposal has been executed (funds disbursed).
    Executed,
    /// The proposal was cancelled by the proposer.
    Cancelled,
}

/// The type of vote cast by a member.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum VoteChoice {
    Yes,
    No,
    Abstain,
}

/// A record of a single vote.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteRecord {
    pub voter: Address,
    pub choice: VoteChoice,
    pub timestamp: u64,
}

/// A budget proposal requesting funds from the treasury.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    /// Unique proposal ID.
    pub id: u32,
    /// Who submitted the proposal.
    pub proposer: Address,
    /// Short title for the proposal.
    pub title: Symbol,
    /// The token being requested.
    pub token: Address,
    /// Amount of tokens requested.
    pub amount: i128,
    /// The recipient of funds if approved.
    pub recipient: Address,
    /// Votes in favor.
    pub yes_votes: u32,
    /// Votes against.
    pub no_votes: u32,
    /// Abstaining votes.
    pub abstain_votes: u32,
    /// List of all vote records.
    pub votes: Vec<VoteRecord>,
    /// Current status.
    pub status: ProposalStatus,
    /// Timestamp when voting begins.
    pub start_time: u64,
    /// Timestamp when voting ends.
    pub end_time: u64,
}

/// Configuration for the governance module.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GovernanceConfig {
    /// Minimum percentage of members that must vote for the proposal to be valid (0-100).
    pub quorum_percentage: u32,
    /// Duration of the voting window in seconds.
    pub voting_duration: u64,
    /// Total number of DAO members.
    pub member_count: u32,
}

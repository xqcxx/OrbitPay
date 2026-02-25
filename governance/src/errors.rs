use soroban_sdk::{contracterror};

/// Error codes for the Governance contract.
#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum GovernanceError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ProposalNotFound = 4,
    VotingNotActive = 5,
    AlreadyVoted = 6,
    NotAMember = 7,
    QuorumNotReached = 8,
    ProposalNotApproved = 9,
    ProposalAlreadyExecuted = 10,
    InvalidAmount = 11,
    VotingPeriodExpired = 12,
    ProposalStillActive = 13,
}

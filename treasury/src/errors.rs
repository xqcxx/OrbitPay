use soroban_sdk::{contracterror};

/// Error codes for the Treasury contract.
/// Each variant maps to a unique u32 for on-chain error reporting.
#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TreasuryError {
    /// The contract has already been initialized.
    AlreadyInitialized = 1,
    /// The contract has not been initialized yet.
    NotInitialized = 2,
    /// The caller is not authorized to perform this action.
    Unauthorized = 3,
    /// The provided threshold is invalid (zero or exceeds signer count).
    InvalidThreshold = 4,
    /// The caller is not a registered signer.
    NotASigner = 5,
    /// The deposit or withdrawal amount is invalid (zero or negative).
    InvalidAmount = 6,
    /// The specified withdrawal proposal was not found.
    ProposalNotFound = 7,
    /// The withdrawal proposal is not in a pending state.
    ProposalNotPending = 8,
    /// The withdrawal proposal has not been approved yet.
    ProposalNotApproved = 9,
    /// The signer has already approved this proposal.
    AlreadyApproved = 10,
    /// The address is already registered as a signer.
    AlreadyASigner = 11,
}

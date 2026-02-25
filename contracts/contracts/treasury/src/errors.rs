use soroban_sdk::contracterror;

/// Error codes for the Treasury contract.
/// Each variant maps to a unique u32 for on-chain error reporting.
#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TreasuryError {
    /// The contract has already been initialized.
    /// Triggered when `initialize()` is called more than once.
    AlreadyInitialized = 1,
    /// The contract has not been initialized yet.
    /// Triggered when calling functions that require an established admin.
    NotInitialized = 2,
    /// The caller is not authorized to perform this action.
    /// Triggered when an admin-only function is called by a non-admin.
    Unauthorized = 3,
    /// The provided threshold is invalid.
    /// Triggered if threshold is zero or exceeds the current signer count.
    InvalidThreshold = 4,
    /// The caller is not a registered signer.
    /// Triggered when a non-signer tries to propose or approve a withdrawal.
    NotASigner = 5,
    /// The deposit or withdrawal amount is invalid.
    /// Triggered if the amount is zero or negative.
    InvalidAmount = 6,
    /// The specified withdrawal proposal was not found.
    /// Triggered when an operation is attempted on a non-existent proposal ID.
    ProposalNotFound = 7,
    /// The withdrawal proposal is not in a pending state.
    /// Triggered when trying to approve or cancel a proposal that is already executed or cancelled.
    ProposalNotPending = 8,
    /// The withdrawal proposal has not been approved yet.
    /// Triggered when trying to execute a proposal that hasn't met the threshold.
    ProposalNotApproved = 9,
    /// The signer has already approved this proposal.
    /// Triggered when a signer attempts to approve the same proposal twice.
    AlreadyApproved = 10,
    /// The address is already registered as a signer.
    /// Triggered when trying to add a signer that already exists in the list.
    AlreadyASigner = 11,
    /// The contract has insufficient token balance for the withdrawal.
    /// Triggered if the treasury balance is lower than the requested withdrawal amount.
    InsufficientBalance = 12,
    /// The withdrawal proposal has expired.
    /// Triggered when attempting to interact with a proposal past its validity period.
    ProposalExpired = 13,
}

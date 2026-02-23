use soroban_sdk::{contracterror};

/// Error codes for the Payroll Stream contract.
#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum StreamError {
    /// The contract has already been initialized.
    AlreadyInitialized = 1,
    /// The contract has not been initialized yet.
    NotInitialized = 2,
    /// The caller is not authorized to perform this action.
    Unauthorized = 3,
    /// The stream amount is invalid (zero or negative).
    InvalidAmount = 4,
    /// The stream duration is invalid (zero or in the past).
    InvalidDuration = 5,
    /// The specified stream was not found.
    StreamNotFound = 6,
    /// The stream has already been cancelled.
    StreamAlreadyCancelled = 7,
    /// The stream has already completed.
    StreamCompleted = 8,
    /// No tokens are available to claim at this time.
    NothingToClaim = 9,
    /// The start time must be in the future or current.
    InvalidStartTime = 10,
    /// The recipient address is invalid or same as sender.
    InvalidRecipient = 11,
}

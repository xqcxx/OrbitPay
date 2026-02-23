use soroban_sdk::{contracttype, Address};

/// Represents the status of a payment stream.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StreamStatus {
    /// The stream is actively distributing tokens.
    Active,
    /// The stream was paused by the organization admin.
    Paused,
    /// The stream was cancelled — remaining funds returned to sender.
    Cancelled,
    /// All tokens have been fully distributed and claimed.
    Completed,
}

/// A payment stream definition.
/// Tokens are linearly streamed from `start_time` to `end_time`.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct PayrollStream {
    /// Unique stream identifier.
    pub id: u32,
    /// The organization / sender who created the stream.
    pub sender: Address,
    /// The employee / recipient of the stream.
    pub recipient: Address,
    /// The token being streamed.
    pub token: Address,
    /// Total amount of tokens to be streamed.
    pub total_amount: i128,
    /// Amount already claimed by the recipient.
    pub claimed_amount: i128,
    /// Unix timestamp when the stream begins.
    pub start_time: u64,
    /// Unix timestamp when the stream ends.
    pub end_time: u64,
    /// Last time a claim was made.
    pub last_claim_time: u64,
    /// Current status of the stream.
    pub status: StreamStatus,
    /// Rate of tokens per second (total_amount / duration).
    pub rate_per_second: i128,
}

/// Summary view for listing streams without full details.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct StreamSummary {
    pub id: u32,
    pub recipient: Address,
    pub total_amount: i128,
    pub claimed_amount: i128,
    pub status: StreamStatus,
}

use soroban_sdk::{contracttype, Address, Symbol, Vec};

/// Represents the status of a withdrawal request in the multi-sig flow.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum WithdrawalStatus {
    /// Waiting for signers to approve.
    Pending,
    /// Threshold met — ready for execution.
    Approved,
    /// Funds have been transferred to the recipient.
    Executed,
    /// The request was cancelled by the proposer or admin.
    Cancelled,
}

/// A withdrawal request that tracks the multi-sig approval process.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WithdrawalRequest {
    /// Unique identifier for this withdrawal request.
    pub id: u32,
    /// The signer who created this withdrawal request.
    pub proposer: Address,
    /// The token address to withdraw.
    pub token: Address,
    /// The recipient address for the funds.
    pub recipient: Address,
    /// The amount of tokens to withdraw.
    pub amount: i128,
    /// A short description or reference for this withdrawal.
    pub memo: Symbol,
    /// List of signers who have approved this request.
    pub approvals: Vec<Address>,
    /// Current status of the withdrawal request.
    pub status: WithdrawalStatus,
    /// Ledger timestamp when the request was created.
    pub created_at: u64,
}

/// Treasury configuration snapshot — used for read-only queries.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TreasuryConfig {
    /// The admin address.
    pub admin: Address,
    /// Current list of authorized signers.
    pub signers: Vec<Address>,
    /// Number of approvals required for a withdrawal.
    pub threshold: u32,
    /// Total number of proposals created.
    pub proposal_count: u32,
}

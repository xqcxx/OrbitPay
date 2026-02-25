use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::WithdrawalRequest;

/// Keys used to store data in the contract's ledger storage.
#[contracttype]
pub enum DataKey {
    /// The admin address — stored in Instance storage.
    Admin,
    /// List of authorized signers — stored in Instance storage.
    Signers,
    /// The multi-sig approval threshold — stored in Instance storage.
    Threshold,
    /// Running count of withdrawal proposals — stored in Instance storage.
    ProposalCount,
    /// A specific withdrawal request — stored in Persistent storage.
    Withdrawal(u32),
}

// ── Admin helpers ────────────────────────────────────────────────

pub fn has_admin(env: &Env) -> bool {
    env.storage().instance().has(&DataKey::Admin)
}

pub fn get_admin(env: &Env) -> Address {
    env.storage().instance().get(&DataKey::Admin).unwrap()
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().instance().set(&DataKey::Admin, admin);
}

// ── Signer helpers ───────────────────────────────────────────────

pub fn get_signers(env: &Env) -> Vec<Address> {
    env.storage().instance().get(&DataKey::Signers).unwrap()
}

pub fn set_signers(env: &Env, signers: &Vec<Address>) {
    env.storage().instance().set(&DataKey::Signers, signers);
}

// ── Threshold helpers ────────────────────────────────────────────

pub fn get_threshold(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::Threshold).unwrap()
}

pub fn set_threshold(env: &Env, threshold: u32) {
    env.storage()
        .instance()
        .set(&DataKey::Threshold, &threshold);
}

// ── Proposal count helpers ───────────────────────────────────────

pub fn get_proposal_count(env: &Env) -> u32 {
    env.storage()
        .instance()
        .get(&DataKey::ProposalCount)
        .unwrap()
}

pub fn set_proposal_count(env: &Env, count: u32) {
    env.storage()
        .instance()
        .set(&DataKey::ProposalCount, &count);
}

// ── Withdrawal helpers ──────────────────────────────────────────

pub fn get_withdrawal(env: &Env, id: u32) -> Option<WithdrawalRequest> {
    env.storage().persistent().get(&DataKey::Withdrawal(id))
}

pub fn set_withdrawal(env: &Env, id: u32, request: &WithdrawalRequest) {
    env.storage()
        .persistent()
        .set(&DataKey::Withdrawal(id), request);
}

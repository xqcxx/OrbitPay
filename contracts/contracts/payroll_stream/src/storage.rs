use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::PayrollStream;

/// Keys used to store data in the contract's ledger storage.
#[contracttype]
pub enum DataKey {
    /// The admin/organization address — stored in Instance storage.
    Admin,
    /// Running count of streams created — stored in Instance storage.
    StreamCount,
    /// A specific stream by ID — stored in Persistent storage.
    Stream(u32),
    /// List of stream IDs for a specific sender — stored in Persistent storage.
    SenderStreams(Address),
    /// List of stream IDs for a specific recipient — stored in Persistent storage.
    RecipientStreams(Address),
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

// ── Stream count helpers ─────────────────────────────────────────

pub fn get_stream_count(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::StreamCount).unwrap_or(0)
}

pub fn set_stream_count(env: &Env, count: u32) {
    env.storage().instance().set(&DataKey::StreamCount, &count);
}

// ── Stream helpers ───────────────────────────────────────────────

pub fn get_stream(env: &Env, id: u32) -> Option<PayrollStream> {
    env.storage().persistent().get(&DataKey::Stream(id))
}

pub fn set_stream(env: &Env, id: u32, stream: &PayrollStream) {
    env.storage().persistent().set(&DataKey::Stream(id), stream);
}

// ── Index helpers for sender/recipient stream lookups ────────────

pub fn get_sender_streams(env: &Env, sender: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::SenderStreams(sender.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn add_sender_stream(env: &Env, sender: &Address, stream_id: u32) {
    let mut streams = get_sender_streams(env, sender);
    streams.push_back(stream_id);
    env.storage()
        .persistent()
        .set(&DataKey::SenderStreams(sender.clone()), &streams);
}

pub fn get_recipient_streams(env: &Env, recipient: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::RecipientStreams(recipient.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn add_recipient_stream(env: &Env, recipient: &Address, stream_id: u32) {
    let mut streams = get_recipient_streams(env, recipient);
    streams.push_back(stream_id);
    env.storage()
        .persistent()
        .set(&DataKey::RecipientStreams(recipient.clone()), &streams);
}

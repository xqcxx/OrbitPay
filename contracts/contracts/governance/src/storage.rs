use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::Proposal;

/// Keys used to store data in the contract's ledger storage.
#[contracttype]
pub enum DataKey {
    Admin,
    Members,
    ProposalCount,
    Proposal(u32),
    QuorumPercentage,
    VotingDuration,
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

// ── Member helpers ───────────────────────────────────────────────

pub fn get_members(env: &Env) -> Vec<Address> {
    env.storage().instance().get(&DataKey::Members).unwrap()
}

pub fn set_members(env: &Env, members: &Vec<Address>) {
    env.storage().instance().set(&DataKey::Members, members);
}

pub fn is_member(env: &Env, address: &Address) -> bool {
    let members = get_members(env);
    for i in 0..members.len() {
        if members.get(i).unwrap() == *address {
            return true;
        }
    }
    false
}

// ── Proposal helpers ─────────────────────────────────────────────

pub fn get_proposal_count(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::ProposalCount).unwrap_or(0)
}

pub fn set_proposal_count(env: &Env, count: u32) {
    env.storage().instance().set(&DataKey::ProposalCount, &count);
}

pub fn get_proposal(env: &Env, id: u32) -> Option<Proposal> {
    env.storage().persistent().get(&DataKey::Proposal(id))
}

pub fn set_proposal(env: &Env, id: u32, proposal: &Proposal) {
    env.storage().persistent().set(&DataKey::Proposal(id), proposal);
}

// ── Config helpers ───────────────────────────────────────────────

pub fn get_quorum_percentage(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::QuorumPercentage).unwrap()
}

pub fn set_quorum_percentage(env: &Env, quorum: u32) {
    env.storage().instance().set(&DataKey::QuorumPercentage, &quorum);
}

pub fn get_voting_duration(env: &Env) -> u64 {
    env.storage().instance().get(&DataKey::VotingDuration).unwrap()
}

pub fn set_voting_duration(env: &Env, duration: u64) {
    env.storage().instance().set(&DataKey::VotingDuration, &duration);
}

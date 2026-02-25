use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::{VestingSchedule, ClaimRecord};

/// Keys used to store data in the contract's ledger storage.
#[contracttype]
pub enum DataKey {
    Admin,
    ScheduleCount,
    Schedule(u32),
    GrantorSchedules(Address),
    BeneficiarySchedules(Address),
    ClaimHistory(u32),
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

// ── Schedule count helpers ───────────────────────────────────────

pub fn get_schedule_count(env: &Env) -> u32 {
    env.storage().instance().get(&DataKey::ScheduleCount).unwrap_or(0)
}

pub fn set_schedule_count(env: &Env, count: u32) {
    env.storage().instance().set(&DataKey::ScheduleCount, &count);
}

// ── Schedule helpers ─────────────────────────────────────────────

pub fn get_schedule(env: &Env, id: u32) -> Option<VestingSchedule> {
    env.storage().persistent().get(&DataKey::Schedule(id))
}

pub fn set_schedule(env: &Env, id: u32, schedule: &VestingSchedule) {
    env.storage().persistent().set(&DataKey::Schedule(id), schedule);
}

// ── Index helpers ────────────────────────────────────────────────

pub fn get_grantor_schedules(env: &Env, grantor: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::GrantorSchedules(grantor.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn add_grantor_schedule(env: &Env, grantor: &Address, schedule_id: u32) {
    let mut schedules = get_grantor_schedules(env, grantor);
    schedules.push_back(schedule_id);
    env.storage()
        .persistent()
        .set(&DataKey::GrantorSchedules(grantor.clone()), &schedules);
}

pub fn get_beneficiary_schedules(env: &Env, beneficiary: &Address) -> Vec<u32> {
    env.storage()
        .persistent()
        .get(&DataKey::BeneficiarySchedules(beneficiary.clone()))
        .unwrap_or(Vec::new(env))
}

pub fn add_beneficiary_schedule(env: &Env, beneficiary: &Address, schedule_id: u32) {
    let mut schedules = get_beneficiary_schedules(env, beneficiary);
    schedules.push_back(schedule_id);
    env.storage()
        .persistent()
        .set(&DataKey::BeneficiarySchedules(beneficiary.clone()), &schedules);
}

// ── Claim history helpers ────────────────────────────────────────

pub fn get_claim_history(env: &Env, schedule_id: u32) -> Vec<ClaimRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::ClaimHistory(schedule_id))
        .unwrap_or(Vec::new(env))
}

pub fn add_claim_record(env: &Env, schedule_id: u32, amount: i128, timestamp: u64) {
    let mut history = get_claim_history(env, schedule_id);
    history.push_back(ClaimRecord { amount, timestamp });
    env.storage()
        .persistent()
        .set(&DataKey::ClaimHistory(schedule_id), &history);
}

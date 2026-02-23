#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, symbol_short};
use types::VestingStatus;

fn setup_env() -> (Env, Address, VestingContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VestingContract, ());
    let client = VestingContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (env, admin, client) = setup_env();
    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_schedule_count(), 0);
}

#[test]
fn test_create_schedule() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    // 4-year vesting with 1-year cliff
    let year = 365 * 24 * 60 * 60_u64;
    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token,
        &100_000_i128,
        &1000_u64,     // start_time
        &year,         // cliff_duration (1 year)
        &(4 * year),   // total_duration (4 years)
        &symbol_short!("team"),
        &true,         // revocable
    );

    assert_eq!(schedule_id, 0);
    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.total_amount, 100_000);
    assert_eq!(schedule.status, VestingStatus::Active);
}

#[test]
fn test_cliff_not_reached() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token,
        &100_000_i128,
        &1000_u64,
        &year,
        &(4 * year),
        &symbol_short!("team"),
        &true,
    );

    // Move time to 6 months (before cliff)
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + (year / 2);
    });

    let progress = client.get_progress(&schedule_id);
    assert_eq!(progress.vested_amount, 0);
    assert_eq!(progress.claimable_amount, 0);
}

#[test]
fn test_vesting_after_cliff() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token,
        &100_000_i128,
        &1000_u64,
        &year,
        &(4 * year),
        &symbol_short!("team"),
        &true,
    );

    // Move to exactly 2 years (50% vested)
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + (2 * year);
    });

    let progress = client.get_progress(&schedule_id);
    assert_eq!(progress.vested_amount, 50_000);
    assert_eq!(progress.claimable_amount, 50_000);
}

#[test]
fn test_revoke_schedule() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token,
        &100_000_i128,
        &1000_u64,
        &year,
        &(4 * year),
        &symbol_short!("team"),
        &true,
    );

    // Move to 2 years, then revoke
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + (2 * year);
    });

    let unvested = client.revoke(&grantor, &schedule_id);
    assert_eq!(unvested, 50_000);

    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.status, VestingStatus::Revoked);
    assert_eq!(schedule.total_amount, 50_000); // Capped at vested
}

// TODO: Additional tests for contributors (see SC-20 in issues)
// - test_full_vesting_after_total_duration
// - test_claim_flow_partial
// - test_non_revocable_schedule_cannot_be_revoked
// - test_double_claim_fails
// - test_unauthorized_revoke

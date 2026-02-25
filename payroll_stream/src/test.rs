#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, testutils::Ledger, Address, Env};
use types::StreamStatus;

fn setup_env() -> (Env, Address, PayrollStreamContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PayrollStreamContract, ());
    let client = PayrollStreamContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (env, admin, client) = setup_env();
    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_stream_count(), 0);
}

#[test]
#[should_panic]
fn test_double_initialize() {
    let (env, admin, client) = setup_env();
    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
fn test_create_stream() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(
        &sender,
        &recipient,
        &token,
        &10000_i128,
        &1000_u64,
        &2000_u64,
    );

    assert_eq!(stream_id, 0);
    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.total_amount, 10000);
    assert_eq!(stream.status, StreamStatus::Active);
    assert_eq!(stream.rate_per_second, 10); // 10000 / 1000 seconds
}

#[test]
fn test_calculate_claimable() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(
        &sender,
        &recipient,
        &token,
        &10000_i128,
        &1000_u64,
        &2000_u64,
    );

    // At 50% of the stream duration
    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    let claimable = client.get_claimable(&stream_id);
    assert_eq!(claimable, 5000); // 50% of 10000
}

#[test]
fn test_cancel_stream() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(
        &sender,
        &recipient,
        &token,
        &10000_i128,
        &1000_u64,
        &2000_u64,
    );

    client.cancel_stream(&sender, &stream_id);
    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Cancelled);
}

// TODO: Additional tests for contributors (see SC-14 in issues)
// - test_claim_flow
// - test_claim_after_stream_ends
// - test_cancel_by_non_sender_fails
// - test_create_stream_invalid_amount
// - test_multiple_streams_same_recipient

#[test]
fn test_pause_resume_stream() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(
        &sender,
        &recipient,
        &token,
        &10000_i128,
        &1000_u64,
        &2000_u64,
    );

    // Advance time and pause
    env.ledger().with_mut(|li| {
        li.timestamp = 1200;
    });

    client.pause_stream(&sender, &stream_id);
    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Paused);
    assert!(stream.paused_at.is_some());

    // Advance time while paused
    env.ledger().with_mut(|li| {
        li.timestamp = 1400;
    });

    // Claiming while paused should work (gets tokens accrued before pause)
    let claimable = client.get_claimable(&stream_id);
    assert_eq!(claimable, 2000); // 200 seconds * 10 rate

    // Resume the stream
    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    client.resume_stream(&sender, &stream_id);
    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Active);
    assert!(stream.paused_at.is_none());
    assert!(stream.total_paused_duration > 0);

    // Advance time after resume
    env.ledger().with_mut(|li| {
        li.timestamp = 1600;
    });

    let claimable = client.get_claimable(&stream_id);
    // 200 seconds before pause + 100 seconds after resume = 300 seconds * 10 = 3000
    assert_eq!(claimable, 3000);
}

#[test]
#[should_panic]
fn test_pause_unauthorized() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let other = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(
        &sender,
        &recipient,
        &token,
        &10000_i128,
        &1000_u64,
        &2000_u64,
    );

    // Try to pause with wrong sender
    client.pause_stream(&other, &stream_id);
}

#[test]
#[should_panic]
fn test_resume_not_paused() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(
        &sender,
        &recipient,
        &token,
        &10000_i128,
        &1000_u64,
        &2000_u64,
    );

    // Try to resume a stream that wasn't paused
    client.resume_stream(&sender, &stream_id);
}

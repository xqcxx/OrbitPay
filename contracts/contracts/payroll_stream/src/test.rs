#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, token, Address, Env, Vec};
use types::StreamStatus;

fn setup_env() -> (Env, Address, PayrollStreamContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(PayrollStreamContract, ());
    let client = PayrollStreamContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

fn create_token_contract<'a>(e: &Env, admin: &Address) -> token::StellarAssetClient<'a> {
    let contract_addr = e
        .register_stellar_asset_contract_v2(admin.clone())
        .address();
    token::StellarAssetClient::new(e, &contract_addr)
}

fn create_token_client<'a>(e: &Env, contract_addr: &Address) -> token::Client<'a> {
    token::Client::new(e, contract_addr)
}

#[test]
fn test_initialize() {
    let (_env, admin, client) = setup_env();
    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_stream_count(), 0);
}

#[test]
#[should_panic]
fn test_double_initialize() {
    let (_env, admin, client) = setup_env();
    client.initialize(&admin);
    client.initialize(&admin);
}

#[test]
fn test_create_stream_transfers_tokens_and_saves_stream() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    assert_eq!(stream_id, 0);
    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&client.address), 10000);

    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.total_amount, 10000);
    assert_eq!(stream.status, StreamStatus::Active);
    assert_eq!(stream.rate_per_second, 10);
}

#[test]
fn test_create_stream_fails_without_balance_and_does_not_persist() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &5000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let result = client.try_create_stream(&sender, &recipient, &token, &10000, &1000, &2000);
    assert_eq!(result, Err(Ok(StreamError::InsufficientBalance)));

    assert_eq!(client.get_stream_count(), 0);
    assert_eq!(token_client.balance(&sender), 5000);
    assert_eq!(token_client.balance(&client.address), 0);
}

#[test]
fn test_create_batch_streams() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let mut streams = Vec::new(&env);
    streams.push_back(CreateStreamParams {
        recipient: Address::generate(&env),
        token: token.clone(),
        total_amount: 10000,
        start_time: 1000,
        end_time: 2000,
    });
    streams.push_back(CreateStreamParams {
        recipient: Address::generate(&env),
        token: token.clone(),
        total_amount: 20000,
        start_time: 1000,
        end_time: 3000,
    });

    let stream_ids = client.create_batch_streams(&sender, &streams);

    assert_eq!(stream_ids.len(), 2);
    assert_eq!(stream_ids.get(0).unwrap(), 0);
    assert_eq!(stream_ids.get(1).unwrap(), 1);

    let stream0 = client.get_stream(&0);
    assert_eq!(stream0.total_amount, 10000);

    let stream1 = client.get_stream(&1);
    assert_eq!(stream1.total_amount, 20000);
}

#[test]
fn test_calculate_claimable() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    let claimable = client.get_claimable(&stream_id);
    assert_eq!(claimable, 5000);
}

#[test]
fn test_claim_transfers_tokens_and_prevents_double_claim() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    let claimed = client.claim(&recipient, &stream_id);
    assert_eq!(claimed, 5000);
    assert_eq!(token_client.balance(&recipient), 5000);
    assert_eq!(token_client.balance(&client.address), 5000);

    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.claimed_amount, 5000);
    assert_eq!(stream.status, StreamStatus::Active);

    let second_claim = client.try_claim(&recipient, &stream_id);
    assert_eq!(second_claim, Err(Ok(StreamError::NothingToClaim)));
    assert_eq!(token_client.balance(&recipient), 5000);
    assert_eq!(token_client.balance(&client.address), 5000);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_claim_rejects_unauthorized_claimer() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let attacker = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    client.claim(&attacker, &stream_id);
}

#[test]
#[should_panic(expected = "Error(Contract, #9)")]
fn test_claim_rejects_when_claimable_is_zero() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);
    client.claim(&recipient, &stream_id);
}

#[test]
fn test_cancel_stream_settles_midway() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    client.cancel_stream(&sender, &stream_id);

    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Cancelled);
    assert_eq!(stream.claimed_amount, 5000);
    assert_eq!(token_client.balance(&recipient), 5000);
    assert_eq!(token_client.balance(&sender), 5000);
    assert_eq!(token_client.balance(&client.address), 0);
}

#[test]
fn test_cancel_stream_zero_owed_refunds_sender_only() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 500;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);
    client.cancel_stream(&sender, &stream_id);

    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Cancelled);
    assert_eq!(stream.claimed_amount, 0);
    assert_eq!(token_client.balance(&recipient), 0);
    assert_eq!(token_client.balance(&sender), 10000);
    assert_eq!(token_client.balance(&client.address), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_cancel_stream_rejects_unauthorized() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);
    let attacker = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 1500;
    });

    client.cancel_stream(&attacker, &stream_id);
}

#[test]
fn test_cancel_stream_after_end() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 2500;
    });

    client.cancel_stream(&sender, &stream_id);

    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Cancelled);
    assert_eq!(stream.claimed_amount, 10000);
    assert_eq!(token_client.balance(&recipient), 10000);
    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&client.address), 0);
}

#[test]
fn test_cancel_stream_after_full_claim_has_zero_settlement() {
    let (env, admin, client) = setup_env();
    let sender = Address::generate(&env);
    let recipient = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_admin_client = create_token_contract(&env, &token_admin);
    let token = token_admin_client.address.clone();
    let token_client = create_token_client(&env, &token);

    token_admin_client.mint(&sender, &10000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let stream_id = client.create_stream(&sender, &recipient, &token, &10000, &1000, &2000);

    env.ledger().with_mut(|li| {
        li.timestamp = 2500;
    });

    let claimed = client.claim(&recipient, &stream_id);
    assert_eq!(claimed, 10000);
    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&recipient), 10000);
    assert_eq!(token_client.balance(&client.address), 0);

    client.cancel_stream(&sender, &stream_id);

    let stream = client.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Cancelled);
    assert_eq!(stream.claimed_amount, 10000);
    assert_eq!(token_client.balance(&sender), 0);
    assert_eq!(token_client.balance(&recipient), 10000);
    assert_eq!(token_client.balance(&client.address), 0);
}

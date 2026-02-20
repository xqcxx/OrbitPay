#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, Symbol, Vec, symbol_short};
use types::WithdrawalStatus;

fn setup_env() -> (Env, Address, TreasuryContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (env, admin, client) = setup_env();
    let signer1 = Address::generate(&env);
    let signer2 = Address::generate(&env);
    let mut signers = Vec::new(&env);
    signers.push_back(signer1);
    signers.push_back(signer2);

    client.initialize(&admin, &signers, &2);

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_threshold(), 2);
    assert_eq!(client.get_signers().len(), 2);
}

#[test]
#[should_panic]
fn test_double_initialize() {
    let (env, admin, client) = setup_env();
    let signer1 = Address::generate(&env);
    let mut signers = Vec::new(&env);
    signers.push_back(signer1);

    client.initialize(&admin, &signers, &1);
    // This should panic with AlreadyInitialized
    client.initialize(&admin, &signers, &1);
}

#[test]
fn test_create_and_approve_withdrawal() {
    let (env, admin, client) = setup_env();
    let signer1 = Address::generate(&env);
    let signer2 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut signers = Vec::new(&env);
    signers.push_back(signer1.clone());
    signers.push_back(signer2.clone());

    client.initialize(&admin, &signers, &2);

    let proposal_id = client.create_withdrawal(
        &signer1,
        &token,
        &recipient,
        &1000_i128,
        &symbol_short!("salary"),
    );
    assert_eq!(proposal_id, 0);

    // First approval is automatic (proposer)
    let request = client.get_withdrawal(&proposal_id);
    assert_eq!(request.approvals.len(), 1);

    // Second signer approves
    client.approve_withdrawal(&signer2, &proposal_id);
    let request = client.get_withdrawal(&proposal_id);
    assert_eq!(request.status, WithdrawalStatus::Approved);
}

#[test]
fn test_add_and_remove_signer() {
    let (env, admin, client) = setup_env();
    let signer1 = Address::generate(&env);
    let signer2 = Address::generate(&env);
    let signer3 = Address::generate(&env);
    let mut signers = Vec::new(&env);
    signers.push_back(signer1.clone());
    signers.push_back(signer2.clone());

    client.initialize(&admin, &signers, &1);

    // Add a signer
    client.add_signer(&admin, &signer3);
    assert_eq!(client.get_signers().len(), 3);

    // Remove a signer
    client.remove_signer(&admin, &signer2);
    assert_eq!(client.get_signers().len(), 2);
}

// TODO: Additional tests for contributors (see SC-8 in issues)
// - test_unauthorized_withdrawal
// - test_threshold_update
// - test_execute_withdrawal
// - test_cancel_withdrawal
// - test_invalid_threshold_rejected

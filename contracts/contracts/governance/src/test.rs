#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, Vec, symbol_short};
use types::{ProposalStatus, VoteChoice};

fn setup_env() -> (Env, Address, GovernanceContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(GovernanceContract, ());
    let client = GovernanceContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

#[test]
fn test_initialize() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1);
    members.push_back(member2);

    client.initialize(&admin, &members, &51, &(7 * 24 * 60 * 60), &3600); // 51% quorum, 7-day voting, 1-hour grace

    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_members().len(), 2);
    let config = client.get_config();
    assert_eq!(config.quorum_percentage, 51);
    assert_eq!(config.total_weight, 2);
}

#[test]
fn test_create_proposal() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());

    client.initialize(&admin, &members, &51, &(7 * 24 * 60 * 60), &3600);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("devfund"),
        &token,
        &50_000_i128,
        &recipient,
    );

    assert_eq!(proposal_id, 0);
    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Active);
    assert_eq!(proposal.amount, 50_000);
}

#[test]
fn test_voting_and_finalization() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());
    members.push_back(member2.clone());
    members.push_back(member3.clone());

    let voting_duration = 7 * 24 * 60 * 60_u64;
    let grace_period = 3600_u64;
    client.initialize(&admin, &members, &51, &voting_duration, &grace_period);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("devfund"),
        &token,
        &50_000_i128,
        &recipient,
    );

    // Members vote
    client.vote(&member1, &proposal_id, &VoteChoice::Yes);
    client.vote(&member2, &proposal_id, &VoteChoice::Yes);
    client.vote(&member3, &proposal_id, &VoteChoice::No);

    // Move past the voting period
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + voting_duration + 1;
    });

    // Finalize
    let status = client.finalize(&admin, &proposal_id);
    assert_eq!(status, ProposalStatus::Approved);
}

#[test]
fn test_quorum_not_reached() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let member3 = Address::generate(&env);
    let member4 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());
    members.push_back(member2.clone());
    members.push_back(member3.clone());
    members.push_back(member4.clone());

    let voting_duration = 7 * 24 * 60 * 60_u64;
    let grace_period = 3600_u64;
    client.initialize(&admin, &members, &51, &voting_duration, &grace_period);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("ops"),
        &token,
        &10_000_i128,
        &recipient,
    );

    // Only 1 out of 4 members votes (25% < 51% quorum)
    client.vote(&member1, &proposal_id, &VoteChoice::Yes);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + voting_duration + 1;
    });

    let status = client.finalize(&admin, &proposal_id);
    assert_eq!(status, ProposalStatus::Rejected);
}

#[test]
fn test_cancel_proposal() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());

    client.initialize(&admin, &members, &51, &1000, &500);

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("ops"),
        &token,
        &10_000_i128,
        &recipient,
    );

    // Initial status should be Active
    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Active);

    // Proposer can cancel
    client.cancel_proposal(&member1, &proposal_id);

    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.status, ProposalStatus::Cancelled);
}

#[test]
fn test_proposal_expiration_live_status() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());

    let voting_duration = 1000u64;
    let grace_period = 500u64;
    client.initialize(&admin, &members, &51, &voting_duration, &grace_period);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("test"),
        &token,
        &1000_i128,
        &recipient,
    );

    // Still Active
    assert_eq!(client.get_proposal_status(&proposal_id), ProposalStatus::Active);

    // Past voting but within grace period -> Still Active (waiting for finalization)
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + voting_duration + 100;
    });
    assert_eq!(client.get_proposal_status(&proposal_id), ProposalStatus::Active);

    // Past grace period -> Expired
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + voting_duration + grace_period + 1;
    });
    assert_eq!(client.get_proposal_status(&proposal_id), ProposalStatus::Expired);
}

#[test]
fn test_weighted_voting() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());
    members.push_back(member2.clone());

    let voting_duration = 1000u64;
    let grace_period = 500u64;
    client.initialize(&admin, &members, &51, &voting_duration, &grace_period);

    // Total weight is 2 initially
    assert_eq!(client.get_config().total_weight, 2);

    // Set member1 weight to 10
    client.set_voting_weight(&admin, &member1, &10);
    assert_eq!(client.get_config().total_weight, 11);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("weight"),
        &token,
        &1000_i128,
        &recipient,
    );

    // Member1 votes Yes (10 weight)
    client.vote(&member1, &proposal_id, &VoteChoice::Yes);
    
    // Member2 votes No (1 weight)
    client.vote(&member2, &proposal_id, &VoteChoice::No);

    let proposal = client.get_proposal(&proposal_id);
    assert_eq!(proposal.yes_votes, 10);
    assert_eq!(proposal.no_votes, 1);

    // Past voting period
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + voting_duration + 1;
    });

    // Finalize: should pass because 10 > 1 and quorum is met (11/11 votes)
    let status = client.finalize(&admin, &proposal_id);
    assert_eq!(status, ProposalStatus::Approved);
}

#[test]
fn test_weighted_quorum() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());
    members.push_back(member2.clone());

    let voting_duration = 1000u64;
    let grace_period = 500u64;
    client.initialize(&admin, &members, &51, &voting_duration, &grace_period);

    // Set member1 weight to 100. Total weight = 101.
    client.set_voting_weight(&admin, &member1, &100);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("quorum"),
        &token,
        &1000_i128,
        &recipient,
    );

    // Only member2 votes (1 weight). 1/101 < 51% quorum.
    client.vote(&member2, &proposal_id, &VoteChoice::Yes);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + voting_duration + 1;
    });

    let status = client.finalize(&admin, &proposal_id);
    assert_eq!(status, ProposalStatus::Rejected);
    
    // Member1 votes Yes later (100 weight). Total = 101. 101/101 > 51% quorum.
    // Resetting for a new proposal to test passed quorum
    let proposal_id_2 = client.create_proposal(
        &member1,
        &symbol_short!("quorum2"),
        &token,
        &1000_i128,
        &recipient,
    );
    client.vote(&member1, &proposal_id_2, &VoteChoice::Yes);
    
    env.ledger().with_mut(|li| {
        li.timestamp = 3200; // Past end_time (3001) but before grace period expiry (3501)
    });
    
    let status_2 = client.finalize(&admin, &proposal_id_2);
    assert_eq!(status_2, ProposalStatus::Approved);
}

#[test]
fn test_member_removal_weight_adjustment() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let member2 = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());
    members.push_back(member2.clone());

    client.initialize(&admin, &members, &51, &1000, &500);

    // Initial total weight = 2
    assert_eq!(client.get_config().total_weight, 2);

    // Member1 weight = 10. Total = 11.
    client.set_voting_weight(&admin, &member1, &10);
    assert_eq!(client.get_config().total_weight, 11);

    // Remove member2 (weight 1). Total should be 10.
    client.remove_member(&admin, &member2);
    assert_eq!(client.get_config().total_weight, 10);
    assert_eq!(client.get_members().len(), 1);

    // Remove member1 (weight 10). Total should be 0.
    client.remove_member(&admin, &member1);
    assert_eq!(client.get_config().total_weight, 0);
    assert_eq!(client.get_members().len(), 0);
}

#[test]
#[should_panic(expected = "Error(Contract, #3)")]
fn test_cancel_proposal_unauthorized() {
    let (env, admin, client) = setup_env();
    let member1 = Address::generate(&env);
    let non_proposer = Address::generate(&env);
    let token = Address::generate(&env);
    let recipient = Address::generate(&env);
    let mut members = Vec::new(&env);
    members.push_back(member1.clone());
    members.push_back(non_proposer.clone());

    client.initialize(&admin, &members, &51, &1000, &500);

    let proposal_id = client.create_proposal(
        &member1,
        &symbol_short!("ops"),
        &token,
        &10_000_i128,
        &recipient,
    );

    // Only the proposer can cancel
    client.cancel_proposal(&non_proposer, &proposal_id);
}

#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, Address, Env, symbol_short, token};
use types::VestingStatus;

fn setup_env() -> (Env, Address, VestingContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(VestingContract, ());
    let client = VestingContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    (env, admin, client)
}

fn create_token_contract<'a>(e: &Env, admin: &Address) -> token::StellarAssetClient<'a> {
    let contract_addr = e.register_stellar_asset_contract_v2(admin.clone()).address();
    token::StellarAssetClient::new(e, &contract_addr)
}

#[test]
fn test_initialize() {
    let (_env, admin, client) = setup_env();
    client.initialize(&admin);
    assert_eq!(client.get_admin(), admin);
    assert_eq!(client.get_schedule_count(), 0);
}

#[test]
fn test_create_schedule() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    // 4-year vesting with 1-year cliff
    let year = 365 * 24 * 60 * 60_u64;
    let total_amount = 100_000_i128;
    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &total_amount,
        &1000_u64,     // start_time
        &year,         // cliff_duration (1 year)
        &25_000_i128,  // cliff_amount (25% for 1/4 time to match linear)
        &(4 * year),   // total_duration (4 years)
        &symbol_short!("team"),
        &true,         // revocable
    );

    assert_eq!(schedule_id, 0);
    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.total_amount, 100_000);
    assert_eq!(schedule.status, VestingStatus::Active);

    // Verify token transfers
    assert_eq!(token_client.balance(&grantor), 0);
    assert_eq!(token_client.balance(&client.address), 100_000);
}

#[test]
fn test_claim_tokens() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &1000_u64,
        &year,
        &25_000_i128,
        &(4 * year),
        &symbol_short!("team"),
        &true,
    );

    // Move to 2 years (50% vested)
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + (2 * year);
    });

    let claimed = client.claim(&beneficiary, &schedule_id);
    assert_eq!(claimed, 50_000);
    
    assert_eq!(token_client.balance(&beneficiary), 50_000);
    assert_eq!(token_client.balance(&client.address), 50_000);
}

#[test]
fn test_revoke_withdrawal() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &1000_u64,
        &year,
        &25_000_i128,
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

    assert_eq!(token_client.balance(&grantor), 50_000);
    assert_eq!(token_client.balance(&client.address), 50_000); // 50k still there for beneficiary to claim
}

#[test]
fn test_insufficient_balance_on_create() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    // Grantor has 0 tokens

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    let result = client.try_create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &1000_u64,
        &year,
        &25_000_i128,
        &(4 * year),
        &symbol_short!("fail"),
        &true,
    );

    assert!(result.is_err());
    // Error(Contract, #12) is InsufficientBalance
}

#[test]
fn test_cliff_not_reached() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &1000_u64,
        &year,
        &25_000_i128,
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
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &1000_u64,
        &year,
        &25_000_i128,
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
fn test_explicit_cliff_amount() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    env.ledger().with_mut(|li| {
        li.timestamp = 1000;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &1000_u64,
        &year,
        &50_000_i128,
        &(4 * year),
        &symbol_short!("custom"),
        &true,
    );

    // 1. Check exactly at cliff
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + year;
    });
    let progress = client.get_progress(&schedule_id);
    assert_eq!(progress.vested_amount, 50_000);

    // 2. Check halfway through remaining vesting
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + year + (year + year / 2);
    });
    let progress_mid = client.get_progress(&schedule_id);
    assert_eq!(progress_mid.vested_amount, 75_000);

    // 3. Check at end
    env.ledger().with_mut(|li| {
        li.timestamp = 1000 + (4 * year);
    });
    let progress_end = client.get_progress(&schedule_id);
    assert_eq!(progress_end.vested_amount, 100_000);
}

#[test]
#[should_panic(expected = "Error(Contract, #4)")] // InvalidAmount
fn test_invalid_cliff_amount() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let token = Address::generate(&env);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;

    client.create_schedule(
        &grantor,
        &beneficiary,
        &token,
        &100_000_i128,
        &1000_u64,
        &year,
        &150_000_i128, // cliff_amount > total_amount
        &(4 * year),
        &symbol_short!("fail"),
        &true,
    );
}

// ── SC-20: Comprehensive Vesting Tests ───────────────────────────

/// SC-20 Task 1: Nothing vests before cliff
#[test]
fn test_nothing_vests_before_cliff() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    // Check at start (0 elapsed)
    let progress = client.get_progress(&schedule_id);
    assert_eq!(progress.vested_amount, 0);
    assert_eq!(progress.claimable_amount, 0);

    // Check at 1 day
    env.ledger().with_mut(|li| { li.timestamp = start_time + 86_400; });
    let progress_1d = client.get_progress(&schedule_id);
    assert_eq!(progress_1d.vested_amount, 0);

    // Check at 6 months (halfway through cliff)
    env.ledger().with_mut(|li| { li.timestamp = start_time + (year / 2); });
    let progress_6m = client.get_progress(&schedule_id);
    assert_eq!(progress_6m.vested_amount, 0);
    assert_eq!(progress_6m.claimable_amount, 0);

    // Check at 1 second before cliff
    env.ledger().with_mut(|li| { li.timestamp = start_time + year - 1; });
    let progress_pre = client.get_progress(&schedule_id);
    assert_eq!(progress_pre.vested_amount, 0);

    // Verify claim attempt before cliff fails
    let claim_result = client.try_claim(&beneficiary, &schedule_id);
    assert!(claim_result.is_err());
}

/// SC-20 Task 2: Exact cliff amount vests at cliff time
#[test]
fn test_exact_cliff_amount_at_cliff_time() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    // Move to exactly cliff time
    env.ledger().with_mut(|li| { li.timestamp = start_time + year; });

    let progress = client.get_progress(&schedule_id);
    assert_eq!(progress.vested_amount, 25_000);
    assert_eq!(progress.claimable_amount, 25_000);

    // Claim exactly the cliff amount
    let claimed = client.claim(&beneficiary, &schedule_id);
    assert_eq!(claimed, 25_000);
    assert_eq!(token_client.balance(&beneficiary), 25_000);
}

/// SC-20 Task 3: Linear vesting at 25%, 50%, 75%
#[test]
fn test_linear_vesting_at_milestones() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    // Use uniform schedule: 100k total, 1yr cliff, 25k cliff_amount, 4yr total
    // cliff_amount = 25k vests at 1yr. remaining 75k linear over 3yrs (year 1 to 4)
    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    // At 25% (1 year) -- cliff amount
    env.ledger().with_mut(|li| { li.timestamp = start_time + year; });
    let p25 = client.get_progress(&schedule_id);
    assert_eq!(p25.vested_amount, 25_000);

    // At 50% (2 years) -- cliff + 1/3 of remaining = 25k + 25k = 50k
    env.ledger().with_mut(|li| { li.timestamp = start_time + (2 * year); });
    let p50 = client.get_progress(&schedule_id);
    assert_eq!(p50.vested_amount, 50_000);

    // At 75% (3 years) -- cliff + 2/3 of remaining = 25k + 50k = 75k
    env.ledger().with_mut(|li| { li.timestamp = start_time + (3 * year); });
    let p75 = client.get_progress(&schedule_id);
    assert_eq!(p75.vested_amount, 75_000);
}

/// SC-20 Task 4: Full vesting after total duration
#[test]
fn test_full_vesting_after_total_duration() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    // Move to exactly end of total duration
    env.ledger().with_mut(|li| { li.timestamp = start_time + (4 * year); });

    let progress = client.get_progress(&schedule_id);
    assert_eq!(progress.vested_amount, 100_000);
    assert_eq!(progress.claimable_amount, 100_000);

    // Claim all
    let claimed = client.claim(&beneficiary, &schedule_id);
    assert_eq!(claimed, 100_000);
    assert_eq!(token_client.balance(&beneficiary), 100_000);
    assert_eq!(token_client.balance(&client.address), 0);

    // Schedule should be FullyClaimed
    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.status, VestingStatus::FullyClaimed);

    // Also verify far past the duration
    env.ledger().with_mut(|li| { li.timestamp = start_time + (10 * year); });
    let progress_late = client.get_progress(&schedule_id);
    assert_eq!(progress_late.vested_amount, 100_000);
}

/// SC-20 Task 5: Claim, then claim again later for remaining
#[test]
fn test_claim_then_claim_remaining() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    // First claim at 2 years (50% vested = 50k)
    env.ledger().with_mut(|li| { li.timestamp = start_time + (2 * year); });
    let first_claim = client.claim(&beneficiary, &schedule_id);
    assert_eq!(first_claim, 50_000);
    assert_eq!(token_client.balance(&beneficiary), 50_000);

    // Verify claimed_amount updated
    let progress_mid = client.get_progress(&schedule_id);
    assert_eq!(progress_mid.claimed_amount, 50_000);
    assert_eq!(progress_mid.claimable_amount, 0);

    // Second claim at 3 years (75% vested = 75k, already claimed 50k, claimable 25k)
    env.ledger().with_mut(|li| { li.timestamp = start_time + (3 * year); });
    let second_claim = client.claim(&beneficiary, &schedule_id);
    assert_eq!(second_claim, 25_000);
    assert_eq!(token_client.balance(&beneficiary), 75_000);

    // Third claim at 4 years (100% vested, already claimed 75k, claimable 25k)
    env.ledger().with_mut(|li| { li.timestamp = start_time + (4 * year); });
    let third_claim = client.claim(&beneficiary, &schedule_id);
    assert_eq!(third_claim, 25_000);
    assert_eq!(token_client.balance(&beneficiary), 100_000);

    // Schedule should be fully claimed now
    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.status, VestingStatus::FullyClaimed);

    // Fourth claim should fail: already fully claimed
    let result = client.try_claim(&beneficiary, &schedule_id);
    assert!(result.is_err());
}

/// SC-20 Task 6: Non-revocable schedule cannot be revoked
#[test]
fn test_non_revocable_schedule_cannot_be_revoked() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    // Create a NON-revocable schedule (revocable = false)
    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("locked"), &false,
    );

    // Advance time and try to revoke
    env.ledger().with_mut(|li| { li.timestamp = start_time + (2 * year); });

    let result = client.try_revoke(&grantor, &schedule_id);
    assert!(result.is_err());

    // Verify schedule remains Active
    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.status, VestingStatus::Active);
    assert_eq!(schedule.total_amount, 100_000);
}

/// SC-20 Task 7: Unauthorized revoke by non-grantor
#[test]
fn test_unauthorized_revoke_by_non_grantor() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    let attacker = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    let schedule_id = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    env.ledger().with_mut(|li| { li.timestamp = start_time + (2 * year); });

    // Attacker tries to revoke -- should fail with Unauthorized
    let result = client.try_revoke(&attacker, &schedule_id);
    assert!(result.is_err());

    // Beneficiary also should not be able to revoke
    let result2 = client.try_revoke(&beneficiary, &schedule_id);
    assert!(result2.is_err());

    // Verify schedule remains intact
    let schedule = client.get_schedule(&schedule_id);
    assert_eq!(schedule.status, VestingStatus::Active);
    assert_eq!(schedule.total_amount, 100_000);
}

/// SC-20 Task 8: Multiple schedules for same beneficiary
#[test]
fn test_multiple_schedules_same_beneficiary() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);

    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &300_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| { li.timestamp = start_time; });

    // Schedule A: 100k, 4yr vesting, 1yr cliff, "team" label
    let id_a = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &100_000_i128, &start_time, &year, &25_000_i128,
        &(4 * year), &symbol_short!("team"), &true,
    );

    // Schedule B: 50k, 2yr vesting, 6mo cliff, "advisor" label
    let id_b = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &50_000_i128, &start_time, &(year / 2), &10_000_i128,
        &(2 * year), &symbol_short!("advisor"), &false,
    );

    // Schedule C: 150k, 4yr vesting, 1yr cliff, "seed" label
    let id_c = client.create_schedule(
        &grantor, &beneficiary, &token_contract.address,
        &150_000_i128, &start_time, &year, &50_000_i128,
        &(4 * year), &symbol_short!("seed"), &true,
    );

    assert_eq!(client.get_schedule_count(), 3);

    // Verify beneficiary index has all 3 schedules
    let beneficiary_schedules = client.get_schedules_by_beneficiary(&beneficiary);
    assert_eq!(beneficiary_schedules.len(), 3);

    // Move to 1 year -- Schedule A: cliff 25k, Schedule B: partially linear, Schedule C: cliff 50k
    env.ledger().with_mut(|li| { li.timestamp = start_time + year; });

    let prog_a = client.get_progress(&id_a);
    assert_eq!(prog_a.vested_amount, 25_000);

    // Schedule B (2yr total, 6mo cliff, 10k cliff_amount, 50k total)
    // At 1yr: cliff_amount(10k) + (40k * (1yr - 6mo) / (2yr - 6mo)) = 10k + 40k * 0.5/1.5 = 10k + 13333 = 23333
    let prog_b = client.get_progress(&id_b);
    assert_eq!(prog_b.vested_amount, 23_333);

    let prog_c = client.get_progress(&id_c);
    assert_eq!(prog_c.vested_amount, 50_000);

    // Claim from all schedules independently
    let claimed_a = client.claim(&beneficiary, &id_a);
    assert_eq!(claimed_a, 25_000);

    let claimed_b = client.claim(&beneficiary, &id_b);
    assert_eq!(claimed_b, 23_333);

    let claimed_c = client.claim(&beneficiary, &id_c);
    assert_eq!(claimed_c, 50_000);

    assert_eq!(token_client.balance(&beneficiary), 98_333); // 25k + 23333 + 50k

    // Verify each schedule tracks claimed amounts independently
    let sched_a = client.get_schedule(&id_a);
    assert_eq!(sched_a.claimed_amount, 25_000);

    let sched_b = client.get_schedule(&id_b);
    assert_eq!(sched_b.claimed_amount, 23_333);

    let sched_c = client.get_schedule(&id_c);
    assert_eq!(sched_c.claimed_amount, 50_000);
}

#[test]
fn test_claim_history() {
    let (env, admin, client) = setup_env();
    let grantor = Address::generate(&env);
    let beneficiary = Address::generate(&env);
    
    let token_admin = Address::generate(&env);
    let token_contract = create_token_contract(&env, &token_admin);
    let _token_client = token::Client::new(&env, &token_contract.address);
    token_contract.mint(&grantor, &100_000);

    client.initialize(&admin);

    let year = 365 * 24 * 60 * 60_u64;
    let start_time = 1000_u64;
    env.ledger().with_mut(|li| {
        li.timestamp = start_time;
    });

    let schedule_id = client.create_schedule(
        &grantor,
        &beneficiary,
        &token_contract.address,
        &100_000_i128,
        &start_time,
        &year,
        &25_000_i128,
        &(4 * year),
        &symbol_short!("legacy"),
        &true,
    );

    // 1. Claim at 2 years
    let time1 = start_time + (2 * year);
    env.ledger().with_mut(|li| {
        li.timestamp = time1;
    });
    client.claim(&beneficiary, &schedule_id);

    // 2. Claim at 3 years
    let time2 = start_time + (3 * year);
    env.ledger().with_mut(|li| {
        li.timestamp = time2;
    });
    client.claim(&beneficiary, &schedule_id);

    let history = client.get_claim_history(&schedule_id);
    assert_eq!(history.len(), 2);
    
    assert_eq!(history.get(0).unwrap().amount, 50_000);
    assert_eq!(history.get(0).unwrap().timestamp, time1);
    
    assert_eq!(history.get(1).unwrap().amount, 25_000);
    assert_eq!(history.get(1).unwrap().timestamp, time2);
}

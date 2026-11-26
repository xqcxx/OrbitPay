//! Cross-contract integration tests.
//!
//! Every test registers the real treasury, governance, payroll stream and
//! vesting contracts in one `Env`, together with a Stellar Asset Contract
//! token, and moves funds between them through their public interfaces.

use governance::errors::GovernanceError;
use governance::types::{ProposalStatus, VoteChoice};
use governance::{GovernanceContract, GovernanceContractClient};
use payroll_stream::errors::StreamError;
use payroll_stream::types::StreamStatus;
use payroll_stream::{PayrollStreamContract, PayrollStreamContractClient};
use soroban_sdk::testutils::{Address as _, Ledger};
use soroban_sdk::{symbol_short, token, vec, Address, Env, Symbol};
use treasury::errors::TreasuryError;
use treasury::types::WithdrawalStatus;
use treasury::{TreasuryContract, TreasuryContractClient};
use vesting::errors::VestingError;
use vesting::types::VestingStatus;
use vesting::{VestingContract, VestingContractClient};

const TREASURY_FUNDS: i128 = 100_000;
const VOTING_DURATION: u64 = 1_000;
const GRACE_PERIOD: u64 = 500;
const START: u64 = 10_000;

/// An organization with all four contracts deployed and a funded treasury.
struct Org {
    env: Env,
    admin: Address,
    /// DAO members, who are also the treasury signers (threshold 2 of 3).
    members: [Address; 3],
    token: token::Client<'static>,
    treasury: TreasuryContractClient<'static>,
    governance: GovernanceContractClient<'static>,
    payroll: PayrollStreamContractClient<'static>,
    vesting: VestingContractClient<'static>,
}

impl Org {
    fn new() -> Self {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = START);

        let admin = Address::generate(&env);
        let members = [
            Address::generate(&env),
            Address::generate(&env),
            Address::generate(&env),
        ];
        let signers = vec![&env, members[0].clone(), members[1].clone(), members[2].clone()];

        let token_address = env
            .register_stellar_asset_contract_v2(admin.clone())
            .address();
        let token = token::Client::new(&env, &token_address);

        let treasury = TreasuryContractClient::new(&env, &env.register(TreasuryContract, ()));
        let governance =
            GovernanceContractClient::new(&env, &env.register(GovernanceContract, ()));
        let payroll =
            PayrollStreamContractClient::new(&env, &env.register(PayrollStreamContract, ()));
        let vesting = VestingContractClient::new(&env, &env.register(VestingContract, ()));

        treasury.initialize(&admin, &signers, &2);
        governance.initialize(&admin, &signers, &51, &VOTING_DURATION, &GRACE_PERIOD);
        payroll.initialize(&admin);
        vesting.initialize(&admin);

        // The treasury `deposit` entrypoint does not move tokens yet, so the
        // vault is funded with a plain token transfer from an outside donor.
        let donor = Address::generate(&env);
        token::StellarAssetClient::new(&env, &token_address).mint(&donor, &TREASURY_FUNDS);
        token.transfer(&donor, &treasury.address, &TREASURY_FUNDS);

        Org {
            env,
            admin,
            members,
            token,
            treasury,
            governance,
            payroll,
            vesting,
        }
    }

    fn set_time(&self, timestamp: u64) {
        self.env.ledger().with_mut(|li| li.timestamp = timestamp);
    }

    /// Runs a budget proposal through governance with the given votes and
    /// returns the proposal id and its finalized status.
    fn decide_budget(
        &self,
        title: Symbol,
        amount: i128,
        recipient: &Address,
        votes: [VoteChoice; 3],
    ) -> (u32, ProposalStatus) {
        let [proposer, ..] = &self.members;
        let id = self.governance.create_proposal(
            proposer,
            &title,
            &self.token.address,
            &amount,
            recipient,
        );
        for (member, choice) in self.members.iter().zip(votes) {
            self.governance.vote(member, &id, &choice);
        }
        let proposal = self.governance.get_proposal(&id);
        self.set_time(proposal.end_time + 1);
        let status = self.governance.finalize(proposer, &id);
        (id, status)
    }

    /// Pays out an approved governance proposal through the treasury
    /// multi-sig and marks the proposal executed.
    fn disburse(&self, proposal_id: u32) -> u32 {
        let proposal = self.governance.get_proposal(&proposal_id);
        let [first, second, _] = &self.members;
        let withdrawal_id = self.treasury.create_withdrawal(
            first,
            &proposal.token,
            &proposal.recipient,
            &proposal.amount,
            &proposal.title,
        );
        self.treasury.approve_withdrawal(second, &withdrawal_id);
        self.treasury.execute_withdrawal(first, &withdrawal_id);
        self.governance.execute(&self.admin, &proposal_id);
        withdrawal_id
    }

    /// Funds `recipient` from the treasury through an approved proposal.
    fn fund_from_treasury(&self, title: Symbol, amount: i128, recipient: &Address) {
        let (id, status) = self.decide_budget(
            title,
            amount,
            recipient,
            [VoteChoice::Yes, VoteChoice::Yes, VoteChoice::Abstain],
        );
        assert_eq!(status, ProposalStatus::Approved);
        self.disburse(id);
    }
}

#[test]
fn approved_proposal_is_disbursed_by_treasury_multisig() {
    let org = Org::new();
    let grantee = Address::generate(&org.env);

    let (proposal_id, status) = org.decide_budget(
        symbol_short!("grant"),
        25_000,
        &grantee,
        [VoteChoice::Yes, VoteChoice::Yes, VoteChoice::No],
    );
    assert_eq!(status, ProposalStatus::Approved);

    let proposal = org.governance.get_proposal(&proposal_id);
    let [first, second, _] = &org.members;
    let withdrawal_id = org.treasury.create_withdrawal(
        first,
        &proposal.token,
        &proposal.recipient,
        &proposal.amount,
        &proposal.title,
    );

    // One approval is below the 2-of-3 threshold, so nothing can move yet.
    assert_eq!(
        org.treasury.try_execute_withdrawal(first, &withdrawal_id),
        Err(Ok(TreasuryError::ProposalNotApproved))
    );
    assert_eq!(org.token.balance(&grantee), 0);

    org.treasury.approve_withdrawal(second, &withdrawal_id);
    org.treasury.execute_withdrawal(first, &withdrawal_id);
    org.governance.execute(&org.admin, &proposal_id);

    assert_eq!(org.token.balance(&grantee), 25_000);
    assert_eq!(org.token.balance(&org.treasury.address), TREASURY_FUNDS - 25_000);
    assert_eq!(
        org.treasury.get_withdrawal(&withdrawal_id).status,
        WithdrawalStatus::Executed
    );
    assert_eq!(
        org.governance.get_proposal(&proposal_id).status,
        ProposalStatus::Executed
    );

    // The same withdrawal cannot be paid twice.
    assert_eq!(
        org.treasury.try_execute_withdrawal(first, &withdrawal_id),
        Err(Ok(TreasuryError::ProposalNotApproved))
    );
    assert_eq!(org.token.balance(&grantee), 25_000);
}

#[test]
fn rejected_proposal_cannot_be_executed_and_funds_stay_in_treasury() {
    let org = Org::new();
    let grantee = Address::generate(&org.env);

    let (proposal_id, status) = org.decide_budget(
        symbol_short!("grant"),
        25_000,
        &grantee,
        [VoteChoice::Yes, VoteChoice::No, VoteChoice::No],
    );
    assert_eq!(status, ProposalStatus::Rejected);
    assert_eq!(
        org.governance.try_execute(&org.admin, &proposal_id),
        Err(Ok(GovernanceError::ProposalNotApproved))
    );
    assert_eq!(org.token.balance(&org.treasury.address), TREASURY_FUNDS);
    assert_eq!(org.token.balance(&grantee), 0);
}

#[test]
fn treasury_budget_funds_payroll_stream_claimed_by_employee() {
    let org = Org::new();
    let employer = Address::generate(&org.env);
    let employee = Address::generate(&org.env);

    org.fund_from_treasury(symbol_short!("payroll"), 12_000, &employer);
    assert_eq!(org.token.balance(&employer), 12_000);

    let start = org.env.ledger().timestamp();
    let stream_id = org.payroll.create_stream(
        &employer,
        &employee,
        &org.token.address,
        &12_000,
        &start,
        &(start + 1_200),
    );
    assert_eq!(org.token.balance(&employer), 0);
    assert_eq!(org.token.balance(&org.payroll.address), 12_000);

    org.set_time(start + 300);
    assert_eq!(org.payroll.claim(&employee, &stream_id), 3_000);

    org.set_time(start + 900);
    assert_eq!(org.payroll.claim(&employee, &stream_id), 6_000);

    org.set_time(start + 5_000);
    assert_eq!(org.payroll.claim(&employee, &stream_id), 3_000);
    assert_eq!(
        org.payroll.try_claim(&employee, &stream_id),
        Err(Ok(StreamError::StreamCompleted))
    );

    let stream = org.payroll.get_stream(&stream_id);
    assert_eq!(stream.status, StreamStatus::Completed);
    assert_eq!(stream.claimed_amount, 12_000);
    assert_eq!(org.token.balance(&employee), 12_000);
    assert_eq!(org.token.balance(&org.payroll.address), 0);
    assert_eq!(org.token.balance(&org.treasury.address), TREASURY_FUNDS - 12_000);
}

#[test]
fn treasury_budget_funds_vesting_schedule_claimed_by_beneficiary() {
    let org = Org::new();
    let grantor = Address::generate(&org.env);
    let advisor = Address::generate(&org.env);

    org.fund_from_treasury(symbol_short!("vesting"), 40_000, &grantor);

    let start = org.env.ledger().timestamp();
    let schedule_id = org.vesting.create_schedule(
        &grantor,
        &advisor,
        &org.token.address,
        &40_000,
        &start,
        &1_000,
        &10_000,
        &4_000,
        &symbol_short!("advisor"),
        &false,
    );
    assert_eq!(org.token.balance(&grantor), 0);
    assert_eq!(org.token.balance(&org.vesting.address), 40_000);

    org.set_time(start + 999);
    assert_eq!(
        org.vesting.try_claim(&advisor, &schedule_id),
        Err(Ok(VestingError::NothingToClaim))
    );

    // Cliff unlock only.
    org.set_time(start + 1_000);
    assert_eq!(org.vesting.claim(&advisor, &schedule_id), 10_000);

    // Halfway through the linear part: 10k cliff + 15k linear.
    org.set_time(start + 2_500);
    assert_eq!(org.vesting.claim(&advisor, &schedule_id), 15_000);

    org.set_time(start + 4_000);
    assert_eq!(org.vesting.claim(&advisor, &schedule_id), 15_000);
    assert_eq!(
        org.vesting.try_claim(&advisor, &schedule_id),
        Err(Ok(VestingError::AlreadyFullyClaimed))
    );

    let schedule = org.vesting.get_schedule(&schedule_id);
    assert_eq!(schedule.status, VestingStatus::FullyClaimed);
    assert_eq!(org.vesting.get_claim_history(&schedule_id).len(), 3);
    assert_eq!(org.token.balance(&advisor), 40_000);
    assert_eq!(org.token.balance(&org.vesting.address), 0);
}

#[test]
fn multiple_users_share_payroll_and_vesting_without_leaking_funds() {
    let org = Org::new();
    let env = &org.env;
    let operator = Address::generate(env);
    let alice = Address::generate(env);
    let bob = Address::generate(env);
    let carol = Address::generate(env);
    let dave = Address::generate(env);

    org.fund_from_treasury(symbol_short!("ops"), 60_000, &operator);
    let start = env.ledger().timestamp();

    let alice_stream = org.payroll.create_stream(
        &operator,
        &alice,
        &org.token.address,
        &10_000,
        &start,
        &(start + 1_000),
    );
    let bob_stream = org.payroll.create_stream(
        &operator,
        &bob,
        &org.token.address,
        &20_000,
        &start,
        &(start + 2_000),
    );
    let carol_schedule = org.vesting.create_schedule(
        &operator,
        &carol,
        &org.token.address,
        &10_000,
        &start,
        &0,
        &0,
        &1_000,
        &symbol_short!("team"),
        &true,
    );
    let dave_schedule = org.vesting.create_schedule(
        &operator,
        &dave,
        &org.token.address,
        &20_000,
        &start,
        &500,
        &5_000,
        &2_000,
        &symbol_short!("seed"),
        &false,
    );
    assert_eq!(org.token.balance(&operator), 0);
    assert_eq!(
        org.payroll.get_streams_by_sender(&operator),
        vec![env, alice_stream, bob_stream]
    );
    assert_eq!(
        org.vesting.get_schedules_by_grantor(&operator),
        vec![env, carol_schedule, dave_schedule]
    );

    org.set_time(start + 500);

    // Nobody can claim another user's stream or schedule.
    assert_eq!(
        org.payroll.try_claim(&bob, &alice_stream),
        Err(Ok(StreamError::Unauthorized))
    );
    assert_eq!(
        org.vesting.try_claim(&carol, &dave_schedule),
        Err(Ok(VestingError::Unauthorized))
    );

    assert_eq!(org.payroll.claim(&alice, &alice_stream), 5_000);
    assert_eq!(org.payroll.claim(&bob, &bob_stream), 5_000);
    assert_eq!(org.vesting.claim(&carol, &carol_schedule), 5_000);
    assert_eq!(org.vesting.claim(&dave, &dave_schedule), 5_000);

    // The operator stops Bob's stream and Carol's grant at the halfway mark.
    // Both were just claimed, so all of the unearned balance goes back.
    org.payroll.cancel_stream(&operator, &bob_stream);
    assert_eq!(org.vesting.revoke(&operator, &carol_schedule), 5_000);
    assert_eq!(org.token.balance(&operator), 20_000);

    org.set_time(start + 2_000);
    assert_eq!(org.payroll.claim(&alice, &alice_stream), 5_000);
    assert_eq!(
        org.payroll.try_claim(&bob, &bob_stream),
        Err(Ok(StreamError::StreamAlreadyCancelled))
    );
    assert_eq!(
        org.vesting.try_claim(&carol, &carol_schedule),
        Err(Ok(VestingError::ScheduleRevoked))
    );
    assert_eq!(org.vesting.claim(&dave, &dave_schedule), 15_000);

    assert_eq!(org.token.balance(&alice), 10_000);
    assert_eq!(org.token.balance(&bob), 5_000);
    assert_eq!(org.token.balance(&carol), 5_000);
    assert_eq!(org.token.balance(&dave), 20_000);
    assert_eq!(org.token.balance(&org.payroll.address), 0);
    assert_eq!(org.token.balance(&org.vesting.address), 0);

    // Every token minted is accounted for across users and contracts.
    let holders = [
        &alice,
        &bob,
        &carol,
        &dave,
        &operator,
        &org.treasury.address,
        &org.payroll.address,
        &org.vesting.address,
    ];
    let total: i128 = holders.iter().map(|a| org.token.balance(a)).sum();
    assert_eq!(total, TREASURY_FUNDS);
}

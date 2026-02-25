#![no_std]
use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, symbol_short};

mod errors;
mod storage;
mod types;

use errors::VestingError;
use storage::{
    get_admin, has_admin, set_admin, get_schedule_count, set_schedule_count,
    get_schedule, set_schedule, add_grantor_schedule, add_beneficiary_schedule,
    get_grantor_schedules, get_beneficiary_schedules,
};
use types::{VestingSchedule, VestingStatus, VestingProgress};

#[contract]
pub struct VestingContract;

#[contractimpl]
impl VestingContract {
    /// Initialize the vesting contract with an admin.
    pub fn initialize(env: Env, admin: Address) -> Result<(), VestingError> {
        if has_admin(&env) {
            return Err(VestingError::AlreadyInitialized);
        }
        admin.require_auth();
        set_admin(&env, &admin);
        set_schedule_count(&env, 0);

        env.events().publish(
            (symbol_short!("init"),),
            admin.clone(),
        );

        Ok(())
    }

    /// Create a new vesting schedule with cliff + linear vesting.
    ///
    /// # Arguments
    /// * `grantor` - The organization creating the schedule (must auth)
    /// * `beneficiary` - The person receiving vested tokens
    /// * `token` - The token to vest
    /// * `total_amount` - Total tokens to vest over the full period
    /// * `start_time` - When vesting begins (unix timestamp)
    /// * `cliff_duration` - Seconds before any tokens vest (cliff period)
    /// * `total_duration` - Total seconds for the full vesting period
    /// * `label` - A descriptor like "team", "advisor", "seed"
    /// * `revocable` - Whether the grantor can revoke unvested tokens
    pub fn create_schedule(
        env: Env,
        grantor: Address,
        beneficiary: Address,
        token: Address,
        total_amount: i128,
        start_time: u64,
        cliff_duration: u64,
        total_duration: u64,
        label: Symbol,
        revocable: bool,
    ) -> Result<u32, VestingError> {
        if !has_admin(&env) {
            return Err(VestingError::NotInitialized);
        }
        grantor.require_auth();

        if total_amount <= 0 {
            return Err(VestingError::InvalidAmount);
        }
        if total_duration == 0 {
            return Err(VestingError::InvalidSchedule);
        }
        if cliff_duration >= total_duration {
            return Err(VestingError::InvalidCliffDuration);
        }

        let schedule_id = get_schedule_count(&env);
        let schedule = VestingSchedule {
            id: schedule_id,
            grantor: grantor.clone(),
            beneficiary: beneficiary.clone(),
            token,
            total_amount,
            claimed_amount: 0,
            start_time,
            cliff_duration,
            total_duration,
            label,
            status: VestingStatus::Active,
            revocable,
        };

        // TODO: Transfer total_amount from grantor to contract (contributor task SC-16)
        // token::Client::new(&env, &token).transfer(&grantor, &env.current_contract_address(), &total_amount);

        set_schedule(&env, schedule_id, &schedule);
        set_schedule_count(&env, schedule_id + 1);
        add_grantor_schedule(&env, &grantor, schedule_id);
        add_beneficiary_schedule(&env, &beneficiary, schedule_id);

        env.events().publish(
            (symbol_short!("v_create"), grantor.clone()),
            schedule_id,
        );

        Ok(schedule_id)
    }

    /// Claim vested tokens. The beneficiary can claim any tokens that have vested
    /// according to the cliff + linear schedule.
    pub fn claim(env: Env, beneficiary: Address, schedule_id: u32) -> Result<i128, VestingError> {
        if !has_admin(&env) {
            return Err(VestingError::NotInitialized);
        }
        beneficiary.require_auth();

        let mut schedule = get_schedule(&env, schedule_id)
            .ok_or(VestingError::ScheduleNotFound)?;

        if schedule.beneficiary != beneficiary {
            return Err(VestingError::Unauthorized);
        }
        if schedule.status == VestingStatus::Revoked {
            return Err(VestingError::ScheduleRevoked);
        }
        if schedule.status == VestingStatus::FullyClaimed {
            return Err(VestingError::AlreadyFullyClaimed);
        }

        let vested = Self::calculate_vested(&env, &schedule);
        let claimable = vested - schedule.claimed_amount;

        if claimable <= 0 {
            return Err(VestingError::NothingToClaim);
        }

        schedule.claimed_amount += claimable;

        if schedule.claimed_amount >= schedule.total_amount {
            schedule.status = VestingStatus::FullyClaimed;
        }

        // TODO: Transfer claimable to beneficiary (contributor task SC-17)
        // token::Client::new(&env, &schedule.token)
        //     .transfer(&env.current_contract_address(), &beneficiary, &claimable);

        set_schedule(&env, schedule_id, &schedule);

        env.events().publish(
            (symbol_short!("v_claim"), beneficiary.clone()),
            claimable,
        );

        Ok(claimable)
    }

    /// Revoke a vesting schedule. Only the grantor can revoke, and only if `revocable` is true.
    /// Unvested tokens are returned to the grantor. Already-vested tokens remain claimable.
    pub fn revoke(
        env: Env,
        grantor: Address,
        schedule_id: u32,
    ) -> Result<i128, VestingError> {
        if !has_admin(&env) {
            return Err(VestingError::NotInitialized);
        }
        grantor.require_auth();

        let mut schedule = get_schedule(&env, schedule_id)
            .ok_or(VestingError::ScheduleNotFound)?;

        if schedule.grantor != grantor {
            return Err(VestingError::Unauthorized);
        }
        if schedule.status == VestingStatus::Revoked {
            return Err(VestingError::ScheduleRevoked);
        }
        if !schedule.revocable {
            return Err(VestingError::Unauthorized);
        }

        let vested = Self::calculate_vested(&env, &schedule);
        let unvested = schedule.total_amount - vested;

        schedule.status = VestingStatus::Revoked;
        schedule.total_amount = vested; // Cap at vested amount

        // TODO: Return unvested tokens to grantor (contributor task SC-18)
        // if unvested > 0 {
        //     token::Client::new(&env, &schedule.token)
        //         .transfer(&env.current_contract_address(), &grantor, &unvested);
        // }

        set_schedule(&env, schedule_id, &schedule);

        env.events().publish(
            (symbol_short!("v_revoke"), grantor.clone()),
            unvested,
        );

        Ok(unvested)
    }

    // ── Internal Helpers ─────────────────────────────────────────

    /// Calculate the total amount of tokens that have vested by now.
    /// Uses cliff + linear vesting model.
    fn calculate_vested(env: &Env, schedule: &VestingSchedule) -> i128 {
        let now = env.ledger().timestamp();

        if now < schedule.start_time {
            return 0;
        }

        let elapsed = now - schedule.start_time;

        // Before cliff: nothing is vested
        if elapsed < schedule.cliff_duration {
            return 0;
        }

        // After full duration: everything is vested
        if elapsed >= schedule.total_duration {
            return schedule.total_amount;
        }

        // Linear vesting: proportional to time elapsed
        let vested = (schedule.total_amount * (elapsed as i128)) / (schedule.total_duration as i128);
        vested
    }

    // ── Query Functions ──────────────────────────────────────────

    /// Get a specific vesting schedule by ID.
    pub fn get_schedule(env: Env, schedule_id: u32) -> Result<VestingSchedule, VestingError> {
        get_schedule(&env, schedule_id).ok_or(VestingError::ScheduleNotFound)
    }

    /// Get the vesting progress for a schedule.
    pub fn get_progress(env: Env, schedule_id: u32) -> Result<VestingProgress, VestingError> {
        let schedule = get_schedule(&env, schedule_id)
            .ok_or(VestingError::ScheduleNotFound)?;

        let vested = Self::calculate_vested(&env, &schedule);
        let claimable = vested - schedule.claimed_amount;

        Ok(VestingProgress {
            total_amount: schedule.total_amount,
            vested_amount: vested,
            claimed_amount: schedule.claimed_amount,
            claimable_amount: if claimable > 0 { claimable } else { 0 },
            status: schedule.status,
        })
    }

    /// Get all schedule IDs for a grantor.
    pub fn get_schedules_by_grantor(env: Env, grantor: Address) -> Vec<u32> {
        get_grantor_schedules(&env, &grantor)
    }

    /// Get all schedule IDs for a beneficiary.
    pub fn get_schedules_by_beneficiary(env: Env, beneficiary: Address) -> Vec<u32> {
        get_beneficiary_schedules(&env, &beneficiary)
    }

    /// Get the total number of schedules created.
    pub fn get_schedule_count(env: Env) -> u32 {
        get_schedule_count(&env)
    }

    /// Get the admin address.
    pub fn get_admin(env: Env) -> Result<Address, VestingError> {
        if !has_admin(&env) {
            return Err(VestingError::NotInitialized);
        }
        Ok(get_admin(&env))
    }

    /// Upgrade the contract WASM. Restricted to admin.
    pub fn upgrade(env: Env, admin: Address, new_wasm_hash: soroban_sdk::BytesN<32>) -> Result<(), VestingError> {
        let stored_admin = get_admin(&env);
        if admin != stored_admin {
            return Err(VestingError::Unauthorized);
        }
        admin.require_auth();
        env.deployer().update_current_contract_wasm(new_wasm_hash);
        Ok(())
    }
}

mod test;

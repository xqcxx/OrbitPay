use soroban_sdk::{contracterror};

/// Error codes for the Vesting contract.
#[contracterror]
#[derive(Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VestingError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidSchedule = 5,
    ScheduleNotFound = 6,
    ScheduleRevoked = 7,
    NothingToClaim = 8,
    CliffNotReached = 9,
    AlreadyFullyClaimed = 10,
    InvalidCliffDuration = 11,
}

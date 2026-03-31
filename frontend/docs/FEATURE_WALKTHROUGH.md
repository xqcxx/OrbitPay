# Admin Revoke Panel - Feature Walkthrough

## User Flow

### Step 1: Navigate to Grantor Dashboard

```
Vesting Page → Click "Grantor Dashboard" Tab
```

- User must have wallet connected
- Tab shows shield icon to indicate admin functionality

### Step 2: View Schedules

The dashboard displays all vesting schedules created by the connected wallet:

```
┌─────────────────────────────────────────────────────────┐
│ 🛡️  Grantor Dashboard                                   │
│ Manage vesting schedules you've created                 │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Team Member A          [Active] [Revocable]   [Revoke]  │
│ Beneficiary: GBXX...XX                                   │
│                                                          │
│ Vesting Progress: ████████░░░░░░░░ 60%                  │
│                                                          │
│ Total: 10,000 ORBT  |  Vested: 6,000 ORBT               │
│ Claimed: 2,000 ORBT |  Unvested: 4,000 ORBT             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Advisor Grant          [Active] [Revocable]   [Revoke]  │
│ Beneficiary: GCYY...YY                                   │
│                                                          │
│ Vesting Progress: ████░░░░░░░░░░░░ 25%                  │
│                                                          │
│ Total: 5,000 ORBT   |  Vested: 1,250 ORBT               │
│ Claimed: 0 ORBT     |  Unvested: 3,750 ORBT             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Former Employee        [Revoked]                         │
│ Beneficiary: GEAA...AA                                   │
│                                                          │
│ Vesting Progress: ████████░░░░░░░░ 50%                  │
│                                                          │
│ Total: 8,000 ORBT   |  Vested: 4,000 ORBT               │
│ Claimed: 3,000 ORBT |  Unvested: 0 ORBT                 │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Click Revoke Button

When user clicks "Revoke" on an active, revocable schedule:

```
┌─────────────────────────────────────────────────────────┐
│                 Revoke Vesting Schedule                  │
│                                                     [X]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ ⚠️  Warning: This action cannot be undone               │
│ Revoking this schedule will return unvested tokens      │
│ to you. Already vested tokens remain claimable.         │
│                                                          │
├─────────────────────────────────────────────────────────┤
│ Schedule Details                                         │
│ Label: Team Member A                                     │
│ Beneficiary: GBXXXXXX...XXXXXXXX                         │
├─────────────────────────────────────────────────────────┤
│ Revocation Impact                                        │
│                                                          │
│ Total Amount:              10,000.00 ORBT                │
│ Already Vested:             6,000.00 ORBT                │
│ Already Claimed:            2,000.00 ORBT                │
│ Unvested (to revoke):       4,000.00 ORBT                │
│                                                          │
│ Tokens Returned to You:    +4,000.00 ORBT                │
│                                                          │
│ ℹ️  Note: The beneficiary can still claim 4,000.00     │
│    ORBT that has already vested.                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│         [Cancel]        [Confirm Revocation]             │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Step 4: Confirm Revocation

User reviews the impact and clicks "Confirm Revocation":

```
┌─────────────────────────────────────────────────────────┐
│                 Revoke Vesting Schedule                  │
│                                                     [X]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                    ⏳ Revoking...                        │
│                                                          │
│  Building transaction → Signing → Submitting            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Step 5: Success Confirmation

After successful revocation:

```
┌─────────────────────────────────────────────────────────┐
│                 Revoke Vesting Schedule                  │
│                                                     [X]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│                        ✅                                │
│                                                          │
│           Schedule Revoked Successfully                  │
│                                                          │
│         4,000.00 tokens returned to your account         │
│                                                          │
│                  (Auto-closing...)                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Step 6: Updated Schedule List

The schedule list automatically refreshes:

```
┌─────────────────────────────────────────────────────────┐
│ Team Member A          [Revoked]                         │
│ Beneficiary: GBXX...XX                                   │
│                                                          │
│ Vesting Progress: ████████░░░░░░░░ 60%                  │
│                                                          │
│ Total: 10,000 ORBT  |  Vested: 6,000 ORBT               │
│ Claimed: 2,000 ORBT |  Unvested: 0 ORBT                 │
└─────────────────────────────────────────────────────────┘
```

## Key Features

### Visual Indicators

- **Status Badges**:
  - 🟢 Active (green)
  - 🔴 Revoked (red)
  - 🔵 Completed (blue)
- **Revocability Badge**: Yellow "Revocable" indicator
- **Progress Bars**: Visual representation of vesting progress
- **Color-Coded Amounts**:
  - Green for vested
  - Blue for claimed
  - Yellow for unvested

### Smart Button Visibility

- Revoke button only appears when:
  - Schedule status is Active
  - Schedule is revocable
  - User is the grantor

### Transaction Flow

1. Calculate impact (client-side)
2. Build XDR with contract call
3. Sign via Freighter wallet
4. Submit to Stellar network
5. Wait for confirmation
6. Show success/error
7. Refresh data

### Error Handling

- Wallet not connected → Show connection prompt
- Schedule not revocable → Button hidden
- Transaction fails → Show error message
- Network issues → Retry logic

## Technical Details

### Contract Call

```typescript
Method: "revoke";
Args: [
  Address(grantor), // Grantor's public key
  u32(schedule_id), // Schedule ID to revoke
];
Returns: i128; // Amount of unvested tokens returned
```

### Vesting Calculation

```typescript
const now = Math.floor(Date.now() / 1000);
const elapsed = now - start_time;

if (elapsed < cliff_duration) {
  vested = 0; // Before cliff
} else if (elapsed >= total_duration) {
  vested = total_amount; // Fully vested
} else {
  // Linear vesting after cliff
  const vestingProgress = elapsed - cliff_duration;
  const vestingDuration = total_duration - cliff_duration;
  vested = (total_amount * vestingProgress) / vestingDuration;
}

unvested = total_amount - vested;
```

## Benefits

### For Grantors

- Easy schedule management
- Clear visibility of all grants
- Safe revocation with impact preview
- Immediate token recovery
- Audit trail of revoked schedules

### For Beneficiaries

- Vested tokens remain claimable
- Transparent process
- No loss of earned tokens

### For the Platform

- Professional admin interface
- Reduced support requests
- Clear audit trail
- Proper access control

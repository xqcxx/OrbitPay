# Admin/Grantor Revoke Panel

## Overview

The Admin/Grantor Revoke Panel allows grantors (organizations or individuals who created vesting schedules) to revoke active vesting schedules and recover unvested tokens.

## Features

### 1. Grantor Dashboard

- **Location**: Vesting page → "Grantor Dashboard" tab
- **Access**: Available to any connected wallet that has created vesting schedules
- **Displays**:
  - List of all vesting schedules created by the connected wallet
  - Schedule status (Active, Revoked, Completed)
  - Revocability indicator
  - Vesting progress visualization
  - Token amounts (total, vested, claimed, unvested)

### 2. Revoke Button

- **Visibility**: Only shown for schedules that are:
  - Active (status = 0)
  - Revocable (revocable = true)
- **Action**: Opens confirmation modal with impact summary

### 3. Revocation Confirmation Modal

Shows detailed impact before revocation:

- **Schedule Details**:
  - Label/name
  - Beneficiary address
- **Impact Summary**:
  - Total amount allocated
  - Already vested amount
  - Already claimed amount
  - Unvested amount (to be revoked)
  - Tokens to be returned to grantor
- **Important Notes**:
  - Warning that action cannot be undone
  - Clarification that vested tokens remain claimable by beneficiary
  - Only unvested tokens are returned

### 4. Transaction Flow

1. User clicks "Revoke" button
2. Modal calculates vesting progress and impact
3. User reviews impact summary
4. User confirms revocation
5. XDR is built for `revoke()` contract call
6. Transaction is signed via Freighter wallet
7. Transaction is submitted to Stellar network
8. Success confirmation shown
9. Schedule list refreshes to show updated state

### 5. Post-Revocation State

- Schedule status changes to "Revoked"
- Unvested tokens returned to grantor
- Vested tokens remain claimable by beneficiary
- Schedule no longer shows revoke button
- Visual indicator shows revoked status

## Technical Implementation

### Components

- **`GrantorPanel.tsx`**: Main dashboard component
  - Fetches schedules by grantor
  - Displays schedule cards with revoke buttons
  - Calculates vesting progress
  - Manages modal state

- **`RevokeModal.tsx`**: Confirmation modal
  - Calculates revocation impact
  - Builds XDR for revoke transaction
  - Handles wallet signing
  - Submits transaction
  - Shows success/error states

### Contract Integration

- **Method**: `revoke(env: Env, grantor: Address, schedule_id: u32)`
- **Requirements**:
  - Grantor must authenticate
  - Schedule must exist
  - Schedule must be revocable
  - Schedule must not already be revoked
- **Returns**: Amount of unvested tokens returned (i128)

### Vesting Calculation

The modal calculates vested amount based on:

- Current time vs start time
- Cliff period (no vesting before cliff)
- Linear vesting after cliff
- Total duration

Formula:

```typescript
if (elapsed < cliff_duration) {
  vested = 0;
} else if (elapsed >= total_duration) {
  vested = total_amount;
} else {
  vestingProgress = elapsed - cliff_duration;
  vestingDuration = total_duration - cliff_duration;
  vested = (total_amount * vestingProgress) / vestingDuration;
}
unvested = total_amount - vested;
```

## User Experience

### Navigation

1. Connect wallet via Freighter
2. Navigate to Vesting page
3. Click "Grantor Dashboard" tab
4. View list of created schedules
5. Click "Revoke" on desired schedule
6. Review impact and confirm

### Visual Feedback

- Loading states during data fetching
- Progress bars showing vesting status
- Color-coded status badges
- Clear token amount formatting
- Warning banners for irreversible actions
- Success/error notifications

### Error Handling

- Wallet not connected
- Schedule not found
- Unauthorized (not grantor)
- Schedule already revoked
- Schedule not revocable
- Transaction simulation failures
- Transaction submission failures

## Future Enhancements

- Real contract integration (currently using mock data)
- Batch revocation for multiple schedules
- Revocation history/audit log
- Email notifications to beneficiaries
- Partial revocation options
- Revocation reasons/notes

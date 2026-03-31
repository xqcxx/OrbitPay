# Proposal Creation Form Implementation

## Overview

This document describes the implementation of the budget proposal creation form for the OrbitPay governance system.

## Files Created/Modified

### New Files

1. **`frontend/src/components/ProposalCreationForm.tsx`**
   - Main form component for creating governance proposals
   - Handles all form validation and submission logic
   - Integrates with the governance contract via `useGovernance` hook

### Modified Files

1. **`frontend/src/app/governance/page.tsx`**
   - Added import for `ProposalCreationForm` component
   - Added "Create New Proposal" button with toggle functionality
   - Added success/error message handling for proposal creation
   - Integrated form into the governance page UI

## Features Implemented

### 1. Title Input

- **Field Type**: Text input
- **Validation**:
  - Required field
  - Max 32 characters (Stellar Symbol constraint)
  - Only alphanumeric characters and underscores allowed
  - Pattern: `/^[a-zA-Z0-9_]+$/`
- **Contract Type**: `Symbol` (Soroban type)
- **Example**: `budget_q1_2024`

### 2. Token Selector

- **Field Type**: Dropdown select
- **Options**: Pre-configured token list
  - USDC (USD Coin)
  - USDT (Tether USD)
  - XLM (Stellar Lumens)
- **Validation**: Required field
- **Contract Type**: `Address` (token contract address)

### 3. Amount Requested

- **Field Type**: Number input
- **Validation**:
  - Required field
  - Must be positive number
  - Up to 7 decimal places (Stellar standard)
  - Pattern: `/^\d+(\.\d{1,7})?$/`
- **Contract Type**: `i128` (converted to stroops: amount × 10^7)
- **Display**: Shows formatted amount with token symbol

### 4. Recipient Address

- **Field Type**: Text input (monospace font)
- **Validation**:
  - Required field
  - Must be valid Stellar Ed25519 public key
  - Validated using `StrKey.isValidEd25519PublicKey()`
  - Auto-uppercase transformation
- **Contract Type**: `Address`
- **Format**: `GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

### 5. Justification Text Area

- **Field Type**: Textarea
- **Validation**:
  - Optional field
  - Max 1000 characters
  - Character counter displayed
- **Storage**: Off-chain (localStorage)
  - Stored in `proposal_justifications` object
  - Key: proposal ID
  - Value: justification text
- **Note**: In production, this should be sent to a backend API or IPFS

### 6. Preview Proposal

- **Feature**: Toggle button to show/hide preview
- **Display**: Shows all form data in a formatted preview card
  - Title
  - Token symbol
  - Amount with token
  - Recipient address (truncated)
  - Justification (if provided)
- **Purpose**: Allows users to review before submission

### 7. XDR Building & Submission

- **Method**: `createProposal()` from `useGovernance` hook
- **Contract Call**: `create_proposal()`
- **Parameters**:
  ```typescript
  createProposal(
    title: string,        // Symbol type
    token: string,        // Address
    amount: number,       // i128 (in stroops)
    recipient: string     // Address
  )
  ```
- **Transaction Flow**:
  1. Form validation
  2. Amount conversion (decimal → stroops)
  3. Build transaction XDR via `buildTransaction()`
  4. Sign with Freighter wallet
  5. Submit to Soroban RPC
  6. Poll for confirmation (max 30 retries, 2s interval)
  7. Store justification off-chain
  8. Trigger success callback

## UI/UX Features

### Styling

- Consistent with existing OrbitPay design system
- Dark theme with gray-800/sky-blue accent colors
- Responsive layout (mobile-friendly)
- Lucide React icons for visual clarity

### User Feedback

- Real-time validation with error messages
- Loading states during submission
- Success/error notifications
- Disabled state when wallet not connected
- Character counters for text fields

### Accessibility

- Proper label associations
- Icon + text labels for clarity
- Keyboard navigation support
- Focus states on inputs
- Disabled state styling

## Integration Points

### Governance Hook (`useGovernance`)

The form uses the following from the hook:

- `createProposal()`: Submit proposal to contract
- `isLoading`: Show loading state
- `isConnected`: Enable/disable form
- `publicKey`: User's wallet address

### Contract Integration

Maps to the Rust contract signature:

```rust
pub fn create_proposal(
    env: Env,
    proposer: Address,      // Auto-filled from wallet
    title: Symbol,          // From form
    token: Address,         // From form
    amount: i128,           // From form (converted)
    recipient: Address,     // From form
) -> Result<u32, GovernanceError>
```

## Testing Checklist

- [ ] Form validation works for all fields
- [ ] Title accepts valid symbols (alphanumeric + underscore)
- [ ] Title rejects invalid characters
- [ ] Amount accepts up to 7 decimals
- [ ] Amount rejects negative values
- [ ] Recipient validates Stellar addresses
- [ ] Token selector shows all options
- [ ] Preview displays correct data
- [ ] Justification saves to localStorage
- [ ] Form submits successfully with valid data
- [ ] Success message appears after creation
- [ ] Error message appears on failure
- [ ] Form resets after successful submission
- [ ] Wallet connection required to submit
- [ ] Loading state shows during submission

## Future Enhancements

1. **Backend Integration**
   - Store justifications in database
   - Add proposal metadata (images, documents)
   - Implement IPFS for decentralized storage

2. **Token Management**
   - Fetch available tokens from contract/API
   - Show token balances
   - Display treasury balance for selected token

3. **Advanced Validation**
   - Check if user is a governance member
   - Validate recipient is not blacklisted
   - Check treasury has sufficient funds

4. **Rich Text Editor**
   - Markdown support for justification
   - File attachments
   - Preview rendering

5. **Draft Proposals**
   - Save drafts locally
   - Auto-save functionality
   - Load previous drafts

## Usage Example

```typescript
import ProposalCreationForm from '@/components/ProposalCreationForm'

function MyPage() {
  const handleSuccess = (proposalId: number) => {
    console.log(`Proposal #${proposalId} created!`)
    // Refresh proposals list, show notification, etc.
  }

  const handleError = (error: string) => {
    console.error('Failed to create proposal:', error)
    // Show error notification
  }

  return (
    <ProposalCreationForm
      onSuccess={handleSuccess}
      onError={handleError}
    />
  )
}
```

## Dependencies

- `react`: Core React library
- `lucide-react`: Icon library
- `@stellar/stellar-sdk`: Stellar SDK for address validation
- `@/hooks/useGovernance`: Custom governance hook
- `@/lib/network`: Network utilities for transaction building

## Notes

- The form uses localStorage for justification storage as a temporary solution
- In production, implement proper backend storage or IPFS
- The title field is limited to Symbol constraints (32 chars, alphanumeric + underscore)
- Amount is converted from decimal to stroops (×10^7) before submission
- All addresses are validated using Stellar's StrKey validation

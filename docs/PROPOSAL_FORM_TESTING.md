# Proposal Creation Form - Testing Guide

## Prerequisites

1. **Install Dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Start Development Server**

   ```bash
   npm run dev
   ```

3. **Configure Freighter Wallet**
   - Install Freighter browser extension
   - Create/import a wallet
   - Switch to Testnet
   - Fund account with test XLM

4. **Configure Contract Addresses**
   - Update `frontend/src/lib/network.ts`
   - Set `CONTRACTS.governance` to deployed contract address

## Manual Testing Checklist

### 1. Form Visibility

- [ ] Navigate to `/governance` page
- [ ] Verify "Create New Proposal" button is visible
- [ ] Click button to show form
- [ ] Click button again to hide form
- [ ] Verify form toggles correctly

### 2. Wallet Connection

- [ ] Disconnect wallet
- [ ] Verify warning message appears
- [ ] Verify "Create New Proposal" button is disabled
- [ ] Connect wallet
- [ ] Verify button becomes enabled
- [ ] Verify warning disappears

### 3. Title Field Validation

**Valid Inputs:**

- [ ] Enter `budget_q1_2024` - should accept
- [ ] Enter `MARKETING_FUND` - should accept
- [ ] Enter `test123` - should accept
- [ ] Enter `a` (1 char) - should accept
- [ ] Enter 32 characters - should accept

**Invalid Inputs:**

- [ ] Enter `budget q1` (space) - should show error
- [ ] Enter `budget-q1` (dash) - should show error
- [ ] Enter `budget.q1` (dot) - should show error
- [ ] Enter 33 characters - should prevent input
- [ ] Leave empty and submit - should show error

### 4. Token Selector

- [ ] Click dropdown
- [ ] Verify USDC option appears
- [ ] Verify USDT option appears
- [ ] Verify XLM option appears
- [ ] Select USDC
- [ ] Verify selection displays correctly
- [ ] Leave empty and submit - should show error

### 5. Amount Field Validation

**Valid Inputs:**

- [ ] Enter `1000` - should accept
- [ ] Enter `1000.5` - should accept
- [ ] Enter `0.0000001` (7 decimals) - should accept
- [ ] Enter `999999999` - should accept

**Invalid Inputs:**

- [ ] Enter `0` - should show error
- [ ] Enter `-100` - should show error
- [ ] Enter `1000.12345678` (8 decimals) - should show error
- [ ] Enter `abc` - should prevent input
- [ ] Leave empty and submit - should show error

**Display:**

- [ ] Enter amount and select token
- [ ] Verify formatted amount shows below field
- [ ] Example: "1,000.5 USDC"

### 6. Recipient Address Validation

**Valid Inputs:**

- [ ] Enter valid Stellar address starting with G
- [ ] Verify address is auto-uppercased
- [ ] Verify no error appears

**Invalid Inputs:**

- [ ] Enter `INVALID` - should show error
- [ ] Enter address with wrong checksum - should show error
- [ ] Enter address starting with C - should show error
- [ ] Leave empty and submit - should show error

### 7. Justification Field

- [ ] Enter text up to 1000 characters
- [ ] Verify character counter updates
- [ ] Verify counter shows `X/1000 characters`
- [ ] Try to enter 1001 characters - should prevent
- [ ] Leave empty - should allow (optional field)

### 8. Preview Functionality

- [ ] Fill all required fields
- [ ] Click "Preview Proposal"
- [ ] Verify preview panel appears
- [ ] Verify title displays correctly
- [ ] Verify token symbol displays
- [ ] Verify amount displays with token
- [ ] Verify recipient shows truncated address
- [ ] Verify justification displays (if provided)
- [ ] Click "Hide Preview"
- [ ] Verify preview panel disappears

### 9. Form Submission

**Successful Submission:**

- [ ] Fill all required fields with valid data
- [ ] Click "Submit Proposal"
- [ ] Verify loading state appears
- [ ] Verify Freighter popup appears
- [ ] Sign transaction in Freighter
- [ ] Wait for confirmation
- [ ] Verify success message appears
- [ ] Verify form closes automatically
- [ ] Verify proposals list refreshes
- [ ] Verify new proposal appears in list

**Failed Submission:**

- [ ] Fill form with valid data
- [ ] Click "Submit Proposal"
- [ ] Reject transaction in Freighter
- [ ] Verify error message appears
- [ ] Verify form remains open
- [ ] Verify can retry submission

### 10. Error Handling

**Network Errors:**

- [ ] Disconnect internet
- [ ] Try to submit
- [ ] Verify error message appears
- [ ] Reconnect internet
- [ ] Verify can retry

**Contract Errors:**

- [ ] Submit with non-member account
- [ ] Verify "Not a member" error appears
- [ ] Submit with insufficient treasury funds
- [ ] Verify appropriate error appears

### 11. Off-Chain Storage

- [ ] Create proposal with justification
- [ ] Note the proposal ID
- [ ] Open browser DevTools → Application → Local Storage
- [ ] Find `proposal_justifications` key
- [ ] Verify justification is stored with proposal ID
- [ ] Refresh page
- [ ] Verify justification persists

### 12. Responsive Design

**Desktop (> 768px):**

- [ ] Verify form is centered
- [ ] Verify max-width is applied
- [ ] Verify all fields are readable

**Tablet (768px - 1024px):**

- [ ] Verify form adapts to width
- [ ] Verify fields stack properly

**Mobile (< 768px):**

- [ ] Verify form is full width
- [ ] Verify all fields are accessible
- [ ] Verify buttons are tappable
- [ ] Verify text is readable

### 13. Accessibility

**Keyboard Navigation:**

- [ ] Tab through all form fields
- [ ] Verify focus indicators are visible
- [ ] Verify can submit with Enter key
- [ ] Verify can toggle preview with Space

**Screen Reader:**

- [ ] Verify labels are announced
- [ ] Verify errors are announced
- [ ] Verify success message is announced

## Automated Testing

### Unit Tests (Example)

```typescript
// frontend/src/components/__tests__/ProposalCreationForm.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ProposalCreationForm from '../ProposalCreationForm'

describe('ProposalCreationForm', () => {
  it('renders form fields', () => {
    render(<ProposalCreationForm />)
    expect(screen.getByLabelText(/proposal title/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/token/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount requested/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/recipient address/i)).toBeInTheDocument()
  })

  it('validates title field', async () => {
    render(<ProposalCreationForm />)
    const titleInput = screen.getByLabelText(/proposal title/i)

    fireEvent.change(titleInput, { target: { value: 'invalid title!' } })
    fireEvent.blur(titleInput)

    await waitFor(() => {
      expect(screen.getByText(/can only contain letters/i)).toBeInTheDocument()
    })
  })

  it('validates amount field', async () => {
    render(<ProposalCreationForm />)
    const amountInput = screen.getByLabelText(/amount requested/i)

    fireEvent.change(amountInput, { target: { value: '-100' } })
    fireEvent.blur(amountInput)

    await waitFor(() => {
      expect(screen.getByText(/must be a positive number/i)).toBeInTheDocument()
    })
  })

  it('shows preview when toggled', () => {
    render(<ProposalCreationForm />)
    const previewButton = screen.getByText(/preview proposal/i)

    fireEvent.click(previewButton)

    expect(screen.getByText(/proposal preview/i)).toBeInTheDocument()
  })
})
```

### Integration Tests (Example)

```typescript
// frontend/src/app/governance/__tests__/page.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import GovernancePage from '../page'

describe('GovernancePage', () => {
  it('toggles proposal form', () => {
    render(<GovernancePage />)
    const createButton = screen.getByText(/create new proposal/i)

    fireEvent.click(createButton)
    expect(screen.getByText(/create budget proposal/i)).toBeInTheDocument()

    fireEvent.click(createButton)
    expect(screen.queryByText(/create budget proposal/i)).not.toBeInTheDocument()
  })

  it('shows success message after creation', async () => {
    render(<GovernancePage />)

    // Mock successful proposal creation
    // ... setup mocks ...

    await waitFor(() => {
      expect(screen.getByText(/proposal #\d+ created successfully/i)).toBeInTheDocument()
    })
  })
})
```

## Performance Testing

### Load Time

- [ ] Measure initial page load time
- [ ] Target: < 2 seconds on 3G
- [ ] Verify form renders without layout shift

### Form Interaction

- [ ] Measure time from input to validation
- [ ] Target: < 100ms for validation feedback
- [ ] Verify no lag when typing

### Transaction Submission

- [ ] Measure time from submit to confirmation
- [ ] Expected: 10-60 seconds (network dependent)
- [ ] Verify loading state throughout

## Security Testing

### Input Sanitization

- [ ] Try SQL injection patterns - should be rejected
- [ ] Try XSS patterns - should be escaped
- [ ] Try extremely long inputs - should be limited

### Address Validation

- [ ] Try invalid checksums - should be rejected
- [ ] Try wrong network addresses - should be rejected
- [ ] Try contract addresses - should be rejected

### Amount Validation

- [ ] Try scientific notation - should handle correctly
- [ ] Try very large numbers - should handle correctly
- [ ] Try negative numbers - should be rejected

## Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Common Issues & Solutions

### Issue: Form doesn't submit

**Check:**

- Wallet is connected
- All required fields are filled
- No validation errors
- Contract address is configured
- Network is correct (testnet/mainnet)

### Issue: Validation errors don't clear

**Solution:**

- Errors should clear on input change
- Check error state management
- Verify error clearing logic

### Issue: Preview doesn't show data

**Solution:**

- Verify state is updated correctly
- Check preview toggle logic
- Ensure data is passed to preview component

### Issue: Transaction fails

**Check:**

- User is a governance member
- Treasury has sufficient funds
- Contract is initialized
- Network connection is stable

## Test Data

### Valid Test Addresses

```
Testnet addresses for testing:
GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF
GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB
```

### Valid Test Amounts

```
Small: 0.0000001
Medium: 1000.50
Large: 999999999.9999999
```

### Valid Test Titles

```
budget_q1_2024
MARKETING_FUND
dev_team_salary
community_grant_001
```

## Reporting Issues

When reporting issues, include:

1. Browser and version
2. Wallet and version
3. Network (testnet/mainnet)
4. Steps to reproduce
5. Expected vs actual behavior
6. Console errors (if any)
7. Screenshots/video

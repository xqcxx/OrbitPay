# Proposal Creation Form Architecture

## Component Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Governance Page                          │
│  (frontend/src/app/governance/page.tsx)                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  "Create New Proposal" Button                      │    │
│  │  (toggles form visibility)                         │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │      ProposalCreationForm Component                │    │
│  │  (frontend/src/components/ProposalCreationForm.tsx)│    │
│  │                                                     │    │
│  │  • Title Input (Symbol)                            │    │
│  │  • Token Selector (Address)                        │    │
│  │  • Amount Input (i128)                             │    │
│  │  • Recipient Address (Address)                     │    │
│  │  • Justification Textarea (off-chain)              │    │
│  │  • Preview Toggle                                  │    │
│  │  • Submit Button                                   │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   useGovernance Hook                         │
│         (frontend/src/hooks/useGovernance.ts)                │
│                                                              │
│  createProposal(title, token, amount, recipient)            │
│         │                                                    │
│         ├─► Validate inputs                                 │
│         ├─► Build transaction XDR                           │
│         ├─► Request wallet signature                        │
│         └─► Submit to network                               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  Network Layer                               │
│           (frontend/src/lib/network.ts)                      │
│                                                              │
│  buildTransaction()                                          │
│         │                                                    │
│         ├─► Create Contract instance                        │
│         ├─► Build operation                                 │
│         ├─► Simulate transaction                            │
│         └─► Assemble transaction                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                 Freighter Wallet                             │
│                                                              │
│  • Sign transaction XDR                                      │
│  • Return signed XDR                                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Soroban RPC Server                              │
│                                                              │
│  submitTransaction()                                         │
│         │                                                    │
│         ├─► Validate transaction                            │
│         ├─► Submit to network                               │
│         └─► Return transaction hash                         │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│            Governance Smart Contract                         │
│   (contracts/contracts/governance/src/lib.rs)                │
│                                                              │
│  create_proposal(                                            │
│    env: Env,                                                 │
│    proposer: Address,      ◄── From wallet                  │
│    title: Symbol,          ◄── From form                    │
│    token: Address,         ◄── From form                    │
│    amount: i128,           ◄── From form (converted)        │
│    recipient: Address      ◄── From form                    │
│  ) -> Result<u32, GovernanceError>                           │
│                                                              │
│  • Validate proposer is member                               │
│  • Validate amount > 0                                       │
│  • Create proposal struct                                    │
│  • Store in contract storage                                 │
│  • Emit event                                                │
│  • Return proposal ID                                        │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                Off-Chain Storage                             │
│                  (localStorage)                              │
│                                                              │
│  proposal_justifications: {                                  │
│    [proposalId]: "justification text..."                    │
│  }                                                           │
│                                                              │
│  Note: In production, use backend API or IPFS               │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Input Data Transformation

```
User Input                    Contract Format
──────────────────────────────────────────────────────────
title: "budget_q1_2024"   →   Symbol (max 32 chars)
token: "CBIEL..."         →   Address (contract address)
amount: "1000.50"         →   i128 (10005000000 stroops)
recipient: "GXXXX..."     →   Address (public key)
justification: "..."      →   localStorage (off-chain)
```

### Validation Pipeline

```
┌──────────────┐
│ User Input   │
└──────┬───────┘
       │
       ▼
┌──────────────────────────────────┐
│ Client-Side Validation           │
│ • Title: 32 chars, alphanumeric  │
│ • Token: selected from list      │
│ • Amount: positive, 7 decimals   │
│ • Recipient: valid Stellar addr  │
│ • Justification: max 1000 chars  │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Data Transformation              │
│ • Amount → stroops (×10^7)       │
│ • Addresses → ScVal              │
│ • Title → Symbol ScVal           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Contract Validation              │
│ • Proposer is member             │
│ • Amount > 0                     │
│ • Contract initialized           │
└──────┬───────────────────────────┘
       │
       ▼
┌──────────────────────────────────┐
│ Proposal Created                 │
│ • Stored on-chain                │
│ • Justification stored off-chain │
│ • Event emitted                  │
│ • ID returned                    │
└──────────────────────────────────┘
```

## State Management

### Form State

```typescript
interface ProposalFormData {
  title: string; // User input
  token: string; // Selected token address
  amount: string; // Decimal string
  recipient: string; // Stellar address
  justification: string; // Optional text
}
```

### Error State

```typescript
interface FormErrors {
  title?: string;
  token?: string;
  amount?: string;
  recipient?: string;
  justification?: string;
}
```

### UI State

```typescript
{
  showPreview: boolean; // Toggle preview visibility
  isLoading: boolean; // From useGovernance hook
  isConnected: boolean; // From useGovernance hook
  createSuccess: string; // Success message
  createError: string; // Error message
}
```

## Error Handling

```
┌─────────────────────────────────────────┐
│ Error Source                            │
└─────────────┬───────────────────────────┘
              │
    ┌─────────┴─────────┬─────────────┬──────────────┐
    │                   │             │              │
    ▼                   ▼             ▼              ▼
┌────────┐      ┌──────────┐   ┌──────────┐   ┌──────────┐
│Validation│    │ Network  │   │ Contract │   │  Wallet  │
│ Errors   │    │  Errors  │   │  Errors  │   │  Errors  │
└────┬─────┘    └────┬─────┘   └────┬─────┘   └────┬─────┘
     │               │              │              │
     │               │              │              │
     └───────────────┴──────────────┴──────────────┘
                     │
                     ▼
          ┌──────────────────────┐
          │  Error Display       │
          │  • Field-level       │
          │  • Form-level        │
          │  • Toast/Banner      │
          └──────────────────────┘
```

## Security Considerations

1. **Input Validation**
   - Client-side validation prevents malformed data
   - Contract-side validation is the source of truth
   - Never trust client input alone

2. **Address Validation**
   - Uses Stellar SDK's `StrKey.isValidEd25519PublicKey()`
   - Prevents invalid addresses from being submitted
   - Auto-uppercase to prevent case issues

3. **Amount Handling**
   - Precise decimal to integer conversion
   - Prevents floating-point errors
   - Contract validates amount > 0

4. **Wallet Integration**
   - User must explicitly sign transaction
   - Freighter wallet shows transaction details
   - User can reject transaction

5. **Off-Chain Data**
   - Justification stored separately
   - Not part of contract state
   - Can be censored/modified (by design)
   - Consider IPFS for immutability

## Performance Considerations

1. **Form Validation**
   - Real-time validation on input change
   - Debounced for expensive validations
   - Clear errors immediately on fix

2. **Transaction Submission**
   - Shows loading state during submission
   - Polls for confirmation (max 30 retries)
   - 2-second intervals between polls
   - Timeout after 60 seconds

3. **State Updates**
   - Form resets after successful submission
   - Proposals list refreshes automatically
   - Success message auto-dismisses after 5s

## Accessibility

- Semantic HTML elements
- Proper label associations
- Keyboard navigation support
- Focus management
- Error announcements
- Loading state indicators
- Color contrast compliance

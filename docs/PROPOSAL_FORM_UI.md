# Proposal Creation Form - UI Overview

## Form Layout

```
┌─────────────────────────────────────────────────────────────┐
│  🗳️ Governance                                              │
│  Create budget proposals, vote Yes/No/Abstain...            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Quorum: 51%    Members: 5    Voting window: 168h          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │ Active   │  │ Approved │  │ Executed │                 │
│  │    3     │  │    5     │  │    2     │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  ➕ Create New Proposal                            │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  📄 Create Budget Proposal                            ││
│  │                                                        ││
│  │  📄 Proposal Title                                    ││
│  │  ┌──────────────────────────────────────────────┐    ││
│  │  │ budget_q1_2024                               │    ││
│  │  └──────────────────────────────────────────────┘    ││
│  │  Max 32 characters, letters, numbers, underscores    ││
│  │                                                        ││
│  │  🪙 Token                                             ││
│  │  ┌──────────────────────────────────────────────┐    ││
│  │  │ USDC - USD Coin                        ▼     │    ││
│  │  └──────────────────────────────────────────────┘    ││
│  │                                                        ││
│  │  💲 Amount Requested                                  ││
│  │  ┌──────────────────────────────────────────────┐    ││
│  │  │ 1000.50                                      │    ││
│  │  └──────────────────────────────────────────────┘    ││
│  │  1,000.5 USDC                                         ││
│  │                                                        ││
│  │  👤 Recipient Address                                 ││
│  │  ┌──────────────────────────────────────────────┐    ││
│  │  │ GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX     │    ││
│  │  └──────────────────────────────────────────────┘    ││
│  │                                                        ││
│  │  Justification (Optional)                             ││
│  │  ┌──────────────────────────────────────────────┐    ││
│  │  │ This budget is needed for Q1 2024 marketing  │    ││
│  │  │ campaigns and community growth initiatives.  │    ││
│  │  │                                              │    ││
│  │  └──────────────────────────────────────────────┘    ││
│  │  125/1000 characters (stored off-chain)              ││
│  │                                                        ││
│  │  ┌────────────────────────────────────────────────┐  ││
│  │  │  👁️ Preview Proposal                          │  ││
│  │  └────────────────────────────────────────────────┘  ││
│  │                                                        ││
│  │  ┌────────────────────────────────────────────────┐  ││
│  │  │  Proposal Preview                              │  ││
│  │  │  ────────────────────────────────────────────  │  ││
│  │  │  Title:        budget_q1_2024                  │  ││
│  │  │  Token:        USDC                            │  ││
│  │  │  Amount:       1,000.5 USDC                    │  ││
│  │  │  Recipient:    GXXXXXXX...XXXXXXXX             │  ││
│  │  │  ────────────────────────────────────────────  │  ││
│  │  │  Justification:                                │  ││
│  │  │  This budget is needed for Q1 2024...          │  ││
│  │  └────────────────────────────────────────────────┘  ││
│  │                                                        ││
│  │  ┌────────────────────────────────────────────────┐  ││
│  │  │  📤 Submit Proposal                            │  ││
│  │  └────────────────────────────────────────────────┘  ││
│  └────────────────────────────────────────────────────────┘│
│                                                              │
│  ✅ Proposal #12 created successfully!                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐│
│  │  #11  🟢 Active                                        ││
│  │  Marketing Budget Q1                                   ││
│  │  Amount: 5,000 USDC  Proposer: GXXXX...XXXX           ││
│  │  ⏰ Ends 2026-04-07 15:30:00                           ││
│  │  ────────────────────────────────────────────────────  ││
│  │  Yes     ████████████░░░░░░░░  60% (3 votes)          ││
│  │  No      ████░░░░░░░░░░░░░░░░  20% (1 vote)           ││
│  │  Abstain ████░░░░░░░░░░░░░░░░  20% (1 vote)           ││
│  │  ────────────────────────────────────────────────────  ││
│  │  Cast your vote                                        ││
│  │  [Yes] [No] [Abstain]                                 ││
│  └────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Form States

### 1. Initial State (Wallet Not Connected)

```
┌────────────────────────────────────────────────────────┐
│  ⚠️ Connect your wallet to create a proposal          │
└────────────────────────────────────────────────────────┘

[Create New Proposal] ← Disabled
```

### 2. Form Open (Empty)

```
┌────────────────────────────────────────────────────────┐
│  📄 Create Budget Proposal                            │
│                                                        │
│  All fields empty with placeholders                   │
│  Submit button enabled                                │
└────────────────────────────────────────────────────────┘
```

### 3. Validation Errors

```
┌────────────────────────────────────────────────────────┐
│  📄 Proposal Title                                    │
│  ┌──────────────────────────────────────────────┐    │
│  │ budget q1 2024                               │    │
│  └──────────────────────────────────────────────┘    │
│  ❌ Title can only contain letters, numbers, and     │
│     underscores                                       │
└────────────────────────────────────────────────────────┘
```

### 4. Loading State

```
┌────────────────────────────────────────────────────────┐
│  ┌────────────────────────────────────────────────┐  │
│  │  ⏳ Creating Proposal...                       │  │
│  └────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### 5. Success State

```
┌────────────────────────────────────────────────────────┐
│  ✅ Proposal #12 created successfully!                │
└────────────────────────────────────────────────────────┘

Form closes automatically
Proposals list refreshes
```

### 6. Error State

```
┌────────────────────────────────────────────────────────┐
│  ❌ Transaction failed: Insufficient funds            │
└────────────────────────────────────────────────────────┘

Form remains open
User can retry
```

## Responsive Behavior

### Desktop (> 768px)

- Form width: max-w-2xl (672px)
- Two-column layout for some fields
- Full preview panel

### Mobile (< 768px)

- Full width with padding
- Single column layout
- Stacked form fields
- Compact preview

## Color Scheme

### Background Colors

- Form container: `bg-gray-800/40`
- Input fields: `bg-gray-800`
- Preview panel: `bg-gray-900/60`

### Border Colors

- Default: `border-gray-700/50`
- Focus: `border-sky-500`
- Error: `border-red-500`

### Text Colors

- Primary: `text-white`
- Secondary: `text-gray-300`
- Muted: `text-gray-400`
- Hint: `text-gray-500`
- Error: `text-red-400`
- Success: `text-green-300`

### Accent Colors

- Primary action: `bg-sky-600` → `hover:bg-sky-700`
- Success: `bg-green-900/40` with `border-green-700/50`
- Error: `bg-red-900/40` with `border-red-700/50`
- Warning: `bg-yellow-900/40` with `border-yellow-700/50`

## Interactive Elements

### Buttons

```
Primary (Submit):
┌────────────────────────────────────┐
│  📤 Submit Proposal                │  ← Sky blue
└────────────────────────────────────┘

Secondary (Preview):
┌────────────────────────────────────┐
│  👁️ Preview Proposal              │  ← Gray
└────────────────────────────────────┘

Disabled:
┌────────────────────────────────────┐
│  📤 Submit Proposal                │  ← Dark gray
└────────────────────────────────────┘
```

### Input Fields

```
Default:
┌────────────────────────────────────┐
│ placeholder text                   │  ← Gray border
└────────────────────────────────────┘

Focus:
┌────────────────────────────────────┐
│ user input|                        │  ← Sky blue ring
└────────────────────────────────────┘

Error:
┌────────────────────────────────────┐
│ invalid input                      │  ← Red border
└────────────────────────────────────┘
❌ Error message here
```

## Icons Used

- 📄 `FileText` - Title, form header
- 🪙 `Coins` - Token selector
- 💲 `DollarSign` - Amount field
- 👤 `User` - Recipient address
- 👁️ `Eye` - Preview toggle
- 📤 `Send` - Submit button
- ⏳ `Loader2` - Loading spinner (animated)

## Accessibility Features

1. **Labels**: All inputs have associated labels with icons
2. **Placeholders**: Helpful examples in each field
3. **Error Messages**: Clear, actionable error text
4. **Character Counters**: Real-time feedback on limits
5. **Loading States**: Visual feedback during submission
6. **Keyboard Navigation**: Tab through all fields
7. **Focus Indicators**: Clear focus rings on inputs
8. **Disabled States**: Visual indication when unavailable

## User Flow

```
1. User clicks "Create New Proposal"
   ↓
2. Form appears with empty fields
   ↓
3. User fills in required fields
   ↓
4. Real-time validation shows errors
   ↓
5. User fixes errors
   ↓
6. User clicks "Preview Proposal" (optional)
   ↓
7. User reviews data in preview
   ↓
8. User clicks "Submit Proposal"
   ↓
9. Loading state appears
   ↓
10. Freighter wallet prompts for signature
    ↓
11. User signs transaction
    ↓
12. Transaction submits to network
    ↓
13. Success message appears
    ↓
14. Form closes and resets
    ↓
15. Proposals list refreshes with new proposal
```

## Edge Cases Handled

1. **Wallet Not Connected**: Form disabled with warning
2. **Invalid Address**: Real-time validation with error
3. **Invalid Amount**: Decimal validation with error
4. **Title Too Long**: Character limit enforced
5. **Special Characters**: Rejected with helpful message
6. **Empty Fields**: Required field validation
7. **Transaction Failure**: Error message with retry option
8. **Network Timeout**: Timeout after 60 seconds
9. **User Cancels**: Form remains open, no changes
10. **Duplicate Submission**: Loading state prevents double-click

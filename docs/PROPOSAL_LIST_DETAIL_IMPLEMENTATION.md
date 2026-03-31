# Proposal List and Detail View Implementation

## Overview

Enhanced the governance page with filtering, countdown timers, and a detailed modal view for proposals.

## Features Implemented

### 1. Status Filter Tabs

- Filter proposals by status: All, Active, Approved, Rejected, Executed
- Each tab shows the count of proposals in that status
- Active tab is highlighted with sky blue background
- Filters update the proposal list in real-time

### 2. Countdown Timer

- Real-time countdown for active proposals
- Shows time remaining in days/hours/minutes format
- Updates every minute
- Displays "Ended" when voting period expires
- Visible on both card view and detail modal

### 3. Proposal Detail Modal

- Full-screen modal with comprehensive proposal information
- Sections include:
  - **Header**: Proposal ID, status badge, title
  - **Countdown Timer**: For active proposals
  - **Key Details**: Amount, recipient, proposer, token (in card grid)
  - **Timeline**: Start and end times
  - **Vote Results**: Visual progress bars with percentages
  - **Vote Records**: Complete list of all votes with timestamps
  - **Voting Actions**: Vote buttons (if eligible)
- Accessible via "View Details" button on each proposal card
- Click outside or X button to close

### 4. Enhanced Proposal Cards

- Added "View Details" button with eye icon
- Countdown timer replaces static end time for active proposals
- Maintains all existing functionality (voting, expand/collapse)

## File Structure

```
frontend/src/
├── app/governance/page.tsx          # Main governance page with filters
└── components/
    └── ProposalDetailModal.tsx      # Detailed proposal view modal
```

## Components

### ProposalDetailModal

**Props:**

- `proposal`: Proposal object
- `isOpen`: Boolean to control visibility
- `onClose`: Callback to close modal
- `onVote`: Optional callback for voting
- `canVote`: Boolean indicating if user can vote
- `userVote`: User's existing vote (if any)
- `isVoting`: Loading state for vote submission

**Features:**

- Responsive design (mobile-friendly)
- Scrollable content for long vote records
- Real-time countdown timer
- Vote percentage calculations
- Formatted timestamps and addresses

### CountdownTimer

**Props:**

- `endTime`: Unix timestamp of proposal end time

**Features:**

- Updates every 60 seconds
- Smart formatting (days/hours/minutes)
- Shows "Ended" when time expires
- Uses useEffect for cleanup

## UI/UX Improvements

### Filter Tabs

```tsx
[All(12)][Active(3)][Approved(5)][Rejected(2)][Executed(2)];
```

- Active tab: Sky blue background
- Inactive tabs: Gray with hover effect
- Counts update dynamically

### Countdown Display

```
Active proposals: "2d 14h" or "5h 23m" or "45m"
Expired: "Ended"
```

### Detail Modal Layout

```
┌─────────────────────────────────────────────┐
│ #12  [Active]  Budget Proposal Q1      [X] │
├─────────────────────────────────────────────┤
│ ⏰ Time remaining: 2d 14h                   │
│                                              │
│ ┌─────────────┐ ┌─────────────┐            │
│ │ Amount      │ │ Recipient   │            │
│ │ 1,000 USDC  │ │ GXXX...XXX  │            │
│ └─────────────┘ └─────────────┘            │
│                                              │
│ 📅 Timeline                                 │
│ Started: 2026-03-28 10:00:00                │
│ Ends: 2026-04-04 10:00:00                   │
│                                              │
│ 📊 Vote Results                             │
│ Yes     ████████████░░░░░░░░  60% (3)       │
│ No      ████░░░░░░░░░░░░░░░░  20% (1)       │
│ Abstain ████░░░░░░░░░░░░░░░░  20% (1)       │
│                                              │
│ Vote Records                                 │
│ GXXX...XXX  [Yes]  2026-03-28 10:05:00      │
│ GYYY...YYY  [No]   2026-03-28 10:10:00      │
│                                              │
│ Cast your vote                               │
│ [Yes] [No] [Abstain]                        │
└─────────────────────────────────────────────┘
```

## State Management

### Governance Page State

```typescript
const [statusFilter, setStatusFilter] = useState<Proposal["status"] | "All">(
  "All",
);
const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
```

### Filtered Proposals

```typescript
const filteredProposals = useMemo(() => {
  if (statusFilter === "All") return proposals;
  return proposals.filter((p) => p.status === statusFilter);
}, [proposals, statusFilter]);
```

## Responsive Design

### Desktop (> 768px)

- Modal: max-width 3xl (768px)
- Detail cards: 2-column grid
- Full filter tab labels

### Mobile (< 768px)

- Modal: Full width with padding
- Detail cards: Single column
- Stacked layout
- Scrollable content

## Color Scheme

### Status Badges

- Active: Sky blue (`bg-sky-500/15`)
- Approved: Green (`bg-green-500/15`)
- Rejected: Red (`bg-red-500/15`)
- Executed: Purple (`bg-purple-500/15`)
- Cancelled: Gray (`bg-gray-500/15`)
- Expired: Orange (`bg-orange-500/15`)

### Interactive Elements

- Primary action: Sky blue (`bg-sky-600`)
- Hover states: Lighter shades
- Disabled: Gray (`bg-gray-700`)

## Accessibility

- Keyboard navigation supported
- ARIA labels on buttons
- Focus indicators on interactive elements
- Semantic HTML structure
- Screen reader friendly

## Performance Optimizations

- `useMemo` for filtered proposals
- Countdown timer updates every 60s (not every second)
- Modal only renders when open
- Efficient re-renders with proper dependencies

## Future Enhancements

Potential improvements:

1. Grid/List view toggle
2. Sort by date, votes, amount
3. Search by title or proposer
4. Export vote records
5. Proposal history timeline visualization
6. Mobile swipe gestures for modal
7. Keyboard shortcuts (ESC to close, arrow keys to navigate)

## Testing Checklist

- [ ] Filter tabs switch correctly
- [ ] Countdown timer updates
- [ ] Modal opens/closes properly
- [ ] Vote buttons work in modal
- [ ] Responsive on mobile
- [ ] Empty states display correctly
- [ ] Loading states work
- [ ] Error messages show properly
- [ ] Accessibility features work
- [ ] Performance is acceptable with many proposals

## Branch

`proposal-list-and-detail-view`

## Related Files

- `frontend/src/hooks/useGovernance.ts` - Data fetching and types
- `frontend/src/components/ProposalCreationForm.tsx` - Create proposals
- `docs/PROPOSAL_FORM_UI.md` - Form documentation

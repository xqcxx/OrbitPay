'use client'

import { useState } from 'react'
import { useGovernance, type Proposal, type VoteChoice } from '@/hooks/useGovernance'
import { CheckCircle, Clock, XCircle, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import ProposalCreationForm from '@/components/ProposalCreationForm'

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: Proposal['status']) {
  const map: Record<Proposal['status'], { label: string; className: string }> = {
    Active:    { label: 'Active',    className: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
    Approved:  { label: 'Approved',  className: 'bg-green-500/15 text-green-300 border-green-500/30' },
    Rejected:  { label: 'Rejected',  className: 'bg-red-500/15 text-red-300 border-red-500/30' },
    Executed:  { label: 'Executed',  className: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    Cancelled: { label: 'Cancelled', className: 'bg-gray-500/15 text-gray-400 border-gray-500/30' },
    Expired:   { label: 'Expired',   className: 'bg-orange-500/15 text-orange-300 border-orange-500/30' },
  }
  const { label, className } = map[status] ?? map.Active
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${className}`}>
      {label}
    </span>
  )
}

function truncate(addr: string, chars = 6) {
  if (addr.length <= chars * 2 + 3) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}

function formatAmount(raw: bigint, decimals = 7) {
  const num = Number(raw) / 10 ** decimals
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function isExpired(endTime: number) {
  return Date.now() / 1000 > endTime
}

// ── VoteTally ─────────────────────────────────────────────────────────────────

function VoteTally({ proposal }: { proposal: Proposal }) {
  const total = Number(proposal.yesVotes + proposal.noVotes + proposal.abstainVotes) || 1

  const bars: { label: string; votes: bigint; color: string }[] = [
    { label: 'Yes',     votes: proposal.yesVotes,     color: 'bg-green-500' },
    { label: 'No',      votes: proposal.noVotes,       color: 'bg-red-500'   },
    { label: 'Abstain', votes: proposal.abstainVotes,  color: 'bg-gray-500'  },
  ]

  return (
    <div className="space-y-2">
      {bars.map(({ label, votes, color }) => {
        const pct = Math.round((Number(votes) / total) * 100)
        return (
          <div key={label}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{label}</span>
              <span>{votes.toString()} ({pct}%)</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── ProposalCard ──────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  publicKey,
  isConnected,
  onVote,
  isVoting,
}: {
  proposal: Proposal
  publicKey: string | null
  isConnected: boolean
  onVote: (id: number, choice: VoteChoice) => Promise<void>
  isVoting: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  const expired = isExpired(proposal.endTime)
  const canVote = isConnected && proposal.status === 'Active' && !expired

  const myVote = publicKey
    ? proposal.votes.find((v) => v.voter === publicKey)
    : undefined

  const handleVote = async (choice: VoteChoice) => {
    await onVote(proposal.id, choice)
  }

  const voteButtons: { choice: VoteChoice; label: string; className: string }[] = [
    {
      choice: 'yes',
      label: 'Yes',
      className:
        'bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20 disabled:opacity-40',
    },
    {
      choice: 'no',
      label: 'No',
      className:
        'bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 disabled:opacity-40',
    },
    {
      choice: 'abstain',
      label: 'Abstain',
      className:
        'bg-gray-500/10 border-gray-500/30 text-gray-300 hover:bg-gray-500/20 disabled:opacity-40',
    },
  ]

  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-mono text-gray-500">#{proposal.id}</span>
            {statusBadge(proposal.status)}
            {expired && proposal.status === 'Active' && (
              <span className="text-xs text-orange-400 font-medium">Period ended</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-gray-400 hover:text-white transition-colors self-start sm:self-auto"
            aria-label={expanded ? 'Collapse' : 'Expand'}
          >
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{proposal.title || '(untitled)'}</h3>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-400">
          <span>
            Amount:{' '}
            <span className="text-white font-semibold">{formatAmount(proposal.amount)}</span>
          </span>
          <span>
            Proposer:{' '}
            <span className="font-mono text-gray-300">{truncate(proposal.proposer)}</span>
          </span>
          {!expired && proposal.status === 'Active' && (
            <span className="flex items-center gap-1">
              <Clock size={13} className="text-sky-400" />
              Ends {new Date(proposal.endTime * 1000).toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* Vote tally — always visible */}
      <div className="px-5 pb-4">
        <VoteTally proposal={proposal} />
      </div>

      {/* Voting controls */}
      {myVote ? (
        <div className="px-5 pb-4 flex items-center gap-2 text-sm">
          <CheckCircle size={15} className="text-green-400 shrink-0" />
          <span className="text-gray-400">
            You voted:{' '}
            <span className="font-bold text-white capitalize">{myVote.choice}</span>
          </span>
        </div>
      ) : canVote ? (
        <div className="px-5 pb-4">
          <p className="text-xs text-gray-500 mb-2">Cast your vote</p>
          <div className="flex flex-wrap gap-2">
            {voteButtons.map(({ choice, label, className }) => (
              <button
                key={choice}
                type="button"
                onClick={() => handleVote(choice)}
                disabled={isVoting}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-bold transition-all min-h-[40px] ${className}`}
              >
                {isVoting ? <Loader2 size={14} className="animate-spin" /> : null}
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : !isConnected && proposal.status === 'Active' && !expired ? (
        <div className="px-5 pb-4 text-sm text-gray-500">Connect wallet to vote</div>
      ) : null}

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-700/50 px-5 py-4 space-y-2 text-sm text-gray-400">
          <div>
            Recipient:{' '}
            <span className="font-mono text-gray-300">{truncate(proposal.recipient, 8)}</span>
          </div>
          <div>
            Token:{' '}
            <span className="font-mono text-gray-300">{truncate(proposal.token, 8)}</span>
          </div>
          <div>
            Start: {new Date(proposal.startTime * 1000).toLocaleString()}
          </div>
          <div>Total votes cast: {proposal.votes.length}</div>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GovernancePage() {
  const {
    proposals,
    config,
    isLoading,
    error,
    isConnected,
    publicKey,
    vote,
  } = useGovernance()

  const [votingId, setVotingId] = useState<number | null>(null)
  const [voteError, setVoteError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [createSuccess, setCreateSuccess] = useState<string | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  const handleVote = async (proposalId: number, choice: VoteChoice) => {
    setVotingId(proposalId)
    setVoteError(null)
    try {
      await vote(proposalId, choice)
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : String(err))
    } finally {
      setVotingId(null)
    }
  }

  const handleCreateSuccess = (proposalId: number) => {
    setCreateSuccess(`Proposal #${proposalId} created successfully!`)
    setShowCreateForm(false)
    setTimeout(() => setCreateSuccess(null), 5000)
  }

  const handleCreateError = (error: string) => {
    setCreateError(error)
    setTimeout(() => setCreateError(null), 5000)
  }

  const activeCount    = proposals.filter((p) => p.status === 'Active').length
  const approvedCount  = proposals.filter((p) => p.status === 'Approved').length
  const executedCount  = proposals.filter((p) => p.status === 'Executed').length

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🗳️ Governance</h1>
        <p className="text-gray-400">
          Create budget proposals, vote Yes / No / Abstain, and execute approved fund
          disbursements.
        </p>
      </div>

      {/* Config strip */}
      {config && (
        <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-400">
          <span>
            Quorum:{' '}
            <span className="font-semibold text-white">{config.quorumPercentage}%</span>
          </span>
          <span>
            Members:{' '}
            <span className="font-semibold text-white">{config.memberCount}</span>
          </span>
          <span>
            Voting window:{' '}
            <span className="font-semibold text-white">
              {Math.round(Number(config.votingDuration) / 3600)}h
            </span>
          </span>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: 'Active',   count: activeCount,   color: 'text-sky-400' },
          { label: 'Approved', count: approvedCount,  color: 'text-green-400' },
          { label: 'Executed', count: executedCount,  color: 'text-purple-400' },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4 text-center"
          >
            <p className={`text-2xl font-black ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Create Proposal Button */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          disabled={!isConnected}
          className="flex items-center gap-2 px-5 py-3 bg-sky-600 hover:bg-sky-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
        >
          <Plus size={18} />
          {showCreateForm ? 'Cancel' : 'Create New Proposal'}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-8">
          <ProposalCreationForm
            onSuccess={handleCreateSuccess}
            onError={handleCreateError}
          />
        </div>
      )}

      {/* Success message */}
      {createSuccess && (
        <div className="mb-6 p-4 bg-green-900/40 border border-green-700/50 rounded-xl text-green-300 text-sm flex items-start gap-2">
          <CheckCircle size={16} className="shrink-0 mt-0.5" />
          {createSuccess}
        </div>
      )}

      {/* Create error */}
      {createError && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm flex items-start gap-2">
          <XCircle size={16} className="shrink-0 mt-0.5" />
          {createError}
        </div>
      )}

      {/* Vote error */}
      {voteError && (
        <div className="mb-6 p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm flex items-start gap-2">
          <XCircle size={16} className="shrink-0 mt-0.5" />
          {voteError}
        </div>
      )}

      {/* Loading */}
      {isLoading && proposals.length === 0 && (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-3">
          <Loader2 className="animate-spin" size={24} />
          Loading proposals…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/40 border border-red-700/50 rounded-xl text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && proposals.length === 0 && !error && (
        <div className="border border-dashed border-gray-600 rounded-xl p-12 text-center text-gray-500">
          No proposals yet.
          {!isConnected && ' Connect your wallet to create a proposal.'}
        </div>
      )}

      {/* Proposal list */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            publicKey={publicKey}
            isConnected={isConnected}
            onVote={handleVote}
            isVoting={votingId === proposal.id}
          />
        ))}
      </div>
    </div>
  )
}

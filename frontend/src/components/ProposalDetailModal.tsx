'use client'

import { type Proposal, type VoteChoice } from '@/hooks/useGovernance'
import { X, Clock, User, Coins, CheckCircle, XCircle, Calendar, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'

function ProposalDetailModal({
  proposal,
  isOpen,
  onClose,
  onVote,
  onExecute,
  canVote,
  canExecute,
  userVote,
  isVoting,
  isExecuting = false,
}: ProposalDetailModalProps) {
  const [showExecuteConfirm, setShowExecuteConfirm] = useState(false)

  if (!isOpen) return null

  const total = Number(proposal.yesVotes + proposal.noVotes + proposal.abstainVotes) || 1
  const yesPercent = Math.round((Number(proposal.yesVotes) / total) * 100)
  const noPercent = Math.round((Number(proposal.noVotes) / total) * 100)
  const abstainPercent = Math.round((Number(proposal.abstainVotes) / total) * 100)

  const isActive = proposal.status === 'Active' && Date.now() / 1000 < proposal.endTime

  const handleExecute = async () => {
    if (onExecute) {
      await onExecute(proposal.id)
      setShowExecuteConfirm(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-mono text-gray-500">#{proposal.id}</span>
                <StatusBadge status={proposal.status} />
              </div>
              <h2 className="text-2xl font-bold text-white">{proposal.title || '(untitled)'}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Countdown Timer */}
            {isActive && (
              <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex items-center gap-3">
                <Clock className="text-sky-400" size={20} />
                <div>
                  <p className="text-sm text-gray-400">Time remaining</p>
                  <p className="text-lg font-bold text-sky-300">
                    <CountdownTimer endTime={proposal.endTime} />
                  </p>
                </div>
              </div>
            )}

            {/* Key Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DetailCard
                icon={<Coins size={18} />}
                label="Amount Requested"
                value={`${formatAmount(proposal.amount)} tokens`}
              />
              <DetailCard
                icon={<User size={18} />}
                label="Recipient"
                value={truncate(proposal.recipient)}
                mono
              />
              <DetailCard
                icon={<User size={18} />}
                label="Proposer"
                value={truncate(proposal.proposer)}
                mono
              />
              <DetailCard
                icon={<Coins size={18} />}
                label="Token"
                value={truncate(proposal.token)}
                mono
              />
            </div>

            {/* Timeline */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Calendar size={16} />
                Timeline
              </h3>
              <div className="space-y-2 text-sm">
                <TimelineItem
                  label="Started"
                  time={new Date(proposal.startTime * 1000).toLocaleString()}
                />
                <TimelineItem
                  label="Ends"
                  time={new Date(proposal.endTime * 1000).toLocaleString()}
                  highlight={isActive}
                />
              </div>
            </div>

            {/* Vote Tally */}
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Vote Results
              </h3>
              <div className="space-y-3">
                <VoteBar
                  label="Yes"
                  votes={proposal.yesVotes.toString()}
                  percent={yesPercent}
                  color="bg-green-500"
                />
                <VoteBar
                  label="No"
                  votes={proposal.noVotes.toString()}
                  percent={noPercent}
                  color="bg-red-500"
                />
                <VoteBar
                  label="Abstain"
                  votes={proposal.abstainVotes.toString()}
                  percent={abstainPercent}
                  color="bg-gray-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Total votes cast: {proposal.votes.length}
              </p>
            </div>

            {/* Vote Records */}
            {proposal.votes.length > 0 && (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                <h3 className="text-sm font-bold text-white mb-3">Vote Records</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {proposal.votes.map((vote, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm py-2 border-b border-gray-700/30 last:border-0"
                    >
                      <span className="font-mono text-gray-400">{truncate(vote.voter, 6)}</span>
                      <div className="flex items-center gap-2">
                        <VoteChoiceBadge choice={vote.choice} />
                        <span className="text-xs text-gray-500">
                          {new Date(vote.timestamp * 1000).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Execute Button (Admin Only) */}
            {canExecute && proposal.status === 'Approved' && onExecute && (
              <div className="bg-purple-900/20 border border-purple-700/30 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-3">
                  This proposal has been approved and is ready for execution
                </p>
                <button
                  type="button"
                  onClick={() => setShowExecuteConfirm(true)}
                  disabled={isExecuting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Execute Proposal
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Voting Actions */}
            {userVote ? (
              <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 flex items-center gap-2">
                <CheckCircle size={18} className="text-green-400" />
                <span className="text-gray-300">
                  You voted: <span className="font-bold text-white capitalize">{userVote}</span>
                </span>
              </div>
            ) : canVote && onVote ? (
              <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                <p className="text-sm text-gray-400 mb-3">Cast your vote</p>
                <div className="flex flex-wrap gap-2">
                  <VoteButton
                    choice="yes"
                    label="Yes"
                    onClick={() => onVote('yes')}
                    disabled={isVoting}
                    className="bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20"
                  />
                  <VoteButton
                    choice="no"
                    label="No"
                    onClick={() => onVote('no')}
                    disabled={isVoting}
                    className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                  />
                  <VoteButton
                    choice="abstain"
                    label="Abstain"
                    onClick={() => onVote('abstain')}
                    disabled={isVoting}
                    className="bg-gray-500/10 border-gray-500/30 text-gray-300 hover:bg-gray-500/20"
                  />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Execute Confirmation Modal */}
      {showExecuteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gray-900 border border-purple-700/50 rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-500/20 rounded-full">
                <CheckCircle className="text-purple-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Confirm Execution</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                You are about to execute this proposal and transfer funds to the recipient.
              </p>

              <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Proposal ID:</span>
                  <span className="text-white font-mono">#{proposal.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Title:</span>
                  <span className="text-white font-semibold">{proposal.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-purple-300 font-bold">
                    {formatAmount(proposal.amount)} tokens
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Recipient:</span>
                  <span className="text-white font-mono text-xs">
                    {truncate(proposal.recipient, 6)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token:</span>
                  <span className="text-white font-mono text-xs">
                    {truncate(proposal.token, 6)}
                  </span>
                </div>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-3 flex gap-2">
                <span className="text-yellow-400 text-lg">⚠️</span>
                <p className="text-xs text-yellow-200">
                  This action cannot be undone. The funds will be transferred immediately upon
                  execution.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowExecuteConfirm(false)}
                disabled={isExecuting}
                className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white font-medium rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecute}
                disabled={isExecuting}
                className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Executing...
                  </>
                ) : (
                  'Confirm & Execute'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function formatAmount(raw: bigint, decimals = 7) {
  const num = Number(raw) / 10 ** decimals
  return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function truncate(addr: string, chars = 8) {
  if (addr.length <= chars * 2 + 3) return addr
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`
}

function CountdownTimer({ endTime }: { endTime: number }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now() / 1000
      const diff = endTime - now

      if (diff <= 0) {
        setTimeLeft('Ended')
        return
      }

      const days = Math.floor(diff / 86400)
      const hours = Math.floor((diff % 86400) / 3600)
      const minutes = Math.floor((diff % 3600) / 60)
      const seconds = Math.floor(diff % 60)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [endTime])

  return <span className="font-mono">{timeLeft}</span>
}

export default function ProposalDetailModal({
  proposal,
  isOpen,
  onClose,
  onVote,
  canVote,
  userVote,
  isVoting,
}: ProposalDetailModalProps) {
  if (!isOpen) return null

  const total = Number(proposal.yesVotes + proposal.noVotes + proposal.abstainVotes) || 1
  const yesPercent = Math.round((Number(proposal.yesVotes) / total) * 100)
  const noPercent = Math.round((Number(proposal.noVotes) / total) * 100)
  const abstainPercent = Math.round((Number(proposal.abstainVotes) / total) * 100)

  const isActive = proposal.status === 'Active' && Date.now() / 1000 < proposal.endTime

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700 p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-gray-500">#{proposal.id}</span>
              <StatusBadge status={proposal.status} />
            </div>
            <h2 className="text-2xl font-bold text-white">{proposal.title || '(untitled)'}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Countdown Timer */}
          {isActive && (
            <div className="bg-sky-500/10 border border-sky-500/30 rounded-xl p-4 flex items-center gap-3">
              <Clock className="text-sky-400" size={20} />
              <div>
                <p className="text-sm text-gray-400">Time remaining</p>
                <p className="text-lg font-bold text-sky-300">
                  <CountdownTimer endTime={proposal.endTime} />
                </p>
              </div>
            </div>
          )}

          {/* Key Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DetailCard
              icon={<Coins size={18} />}
              label="Amount Requested"
              value={`${formatAmount(proposal.amount)} tokens`}
            />
            <DetailCard
              icon={<User size={18} />}
              label="Recipient"
              value={truncate(proposal.recipient)}
              mono
            />
            <DetailCard
              icon={<User size={18} />}
              label="Proposer"
              value={truncate(proposal.proposer)}
              mono
            />
            <DetailCard
              icon={<Coins size={18} />}
              label="Token"
              value={truncate(proposal.token)}
              mono
            />
          </div>

          {/* Timeline */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Calendar size={16} />
              Timeline
            </h3>
            <div className="space-y-2 text-sm">
              <TimelineItem
                label="Started"
                time={new Date(proposal.startTime * 1000).toLocaleString()}
              />
              <TimelineItem
                label="Ends"
                time={new Date(proposal.endTime * 1000).toLocaleString()}
                highlight={isActive}
              />
            </div>
          </div>

          {/* Vote Tally */}
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <TrendingUp size={16} />
              Vote Results
            </h3>
            <div className="space-y-3">
              <VoteBar
                label="Yes"
                votes={proposal.yesVotes.toString()}
                percent={yesPercent}
                color="bg-green-500"
              />
              <VoteBar
                label="No"
                votes={proposal.noVotes.toString()}
                percent={noPercent}
                color="bg-red-500"
              />
              <VoteBar
                label="Abstain"
                votes={proposal.abstainVotes.toString()}
                percent={abstainPercent}
                color="bg-gray-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Total votes cast: {proposal.votes.length}
            </p>
          </div>

          {/* Vote Records */}
          {proposal.votes.length > 0 && (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <h3 className="text-sm font-bold text-white mb-3">Vote Records</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {proposal.votes.map((vote, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm py-2 border-b border-gray-700/30 last:border-0"
                  >
                    <span className="font-mono text-gray-400">{truncate(vote.voter, 6)}</span>
                    <div className="flex items-center gap-2">
                      <VoteChoiceBadge choice={vote.choice} />
                      <span className="text-xs text-gray-500">
                        {new Date(vote.timestamp * 1000).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Voting Actions */}
          {userVote ? (
            <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 flex items-center gap-2">
              <CheckCircle size={18} className="text-green-400" />
              <span className="text-gray-300">
                You voted: <span className="font-bold text-white capitalize">{userVote}</span>
              </span>
            </div>
          ) : canVote && onVote ? (
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
              <p className="text-sm text-gray-400 mb-3">Cast your vote</p>
              <div className="flex flex-wrap gap-2">
                <VoteButton
                  choice="yes"
                  label="Yes"
                  onClick={() => onVote('yes')}
                  disabled={isVoting}
                  className="bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20"
                />
                <VoteButton
                  choice="no"
                  label="No"
                  onClick={() => onVote('no')}
                  disabled={isVoting}
                  className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                />
                <VoteButton
                  choice="abstain"
                  label="Abstain"
                  onClick={() => onVote('abstain')}
                  disabled={isVoting}
                  className="bg-gray-500/10 border-gray-500/30 text-gray-300 hover:bg-gray-500/20"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

// Helper Components

function StatusBadge({ status }: { status: Proposal['status'] }) {
  const styles: Record<Proposal['status'], string> = {
    Active: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
    Approved: 'bg-green-500/15 text-green-300 border-green-500/30',
    Rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
    Executed: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
    Cancelled: 'bg-gray-500/15 text-gray-400 border-gray-500/30',
    Expired: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  }
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${styles[status]}`}>
      {status}
    </span>
  )
}

function DetailCard({
  icon,
  label,
  value,
  mono = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
      <div className="flex items-center gap-2 text-gray-400 mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className={`text-white font-semibold ${mono ? 'font-mono text-sm' : ''}`}>{value}</p>
    </div>
  )
}

function TimelineItem({
  label,
  time,
  highlight = false,
}: {
  label: string
  time: string
  highlight?: boolean
}) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400">{label}:</span>
      <span className={highlight ? 'text-sky-300 font-semibold' : 'text-gray-300'}>{time}</span>
    </div>
  )
}

function VoteBar({
  label,
  votes,
  percent,
  color,
}: {
  label: string
  votes: string
  percent: number
  color: string
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>{label}</span>
        <span>
          {votes} ({percent}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function VoteChoiceBadge({ choice }: { choice: VoteChoice }) {
  const styles = {
    yes: 'bg-green-500/20 text-green-300 border-green-500/30',
    no: 'bg-red-500/20 text-red-300 border-red-500/30',
    abstain: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  }
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${styles[choice]}`}>
      {choice.charAt(0).toUpperCase() + choice.slice(1)}
    </span>
  )
}

function VoteButton({
  choice,
  label,
  onClick,
  disabled,
  className,
}: {
  choice: VoteChoice
  label: string
  onClick: () => void
  disabled: boolean
  className: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all disabled:opacity-40 ${className}`}
    >
      {label}
    </button>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getSorobanServer,
  CONTRACTS,
  NETWORK,
  buildTransaction,
  addressToScVal,
  u64ToScVal,
  stringToScVal,
} from '@/lib/network'
import { xdr, scValToNative, nativeToScVal, Contract, TransactionBuilder } from '@stellar/stellar-sdk'
import { useFreighter } from '@/contexts/FreighterContext'
import { signTransaction } from '@stellar/freighter-api'

// ── Types ─────────────────────────────────────────────────────────────────────

export type VoteChoice = 'yes' | 'no' | 'abstain'

export interface VoteRecord {
  voter: string
  choice: VoteChoice
  timestamp: number
}

export interface Proposal {
  id: number
  proposer: string
  title: string
  token: string
  amount: bigint
  recipient: string
  yesVotes: bigint
  noVotes: bigint
  abstainVotes: bigint
  status: 'Active' | 'Approved' | 'Rejected' | 'Executed' | 'Cancelled' | 'Expired'
  startTime: number
  endTime: number
  votes: VoteRecord[]
}

export interface GovernanceConfig {
  quorumPercentage: number
  votingDuration: bigint
  gracePeriod: bigint
  memberCount: number
  totalWeight: bigint
}

// ── Dummy source account (read-only simulation) ───────────────────────────────
const DUMMY_ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'

function decodeVoteChoice(raw: unknown): VoteChoice {
  if (typeof raw === 'object' && raw !== null) {
    const key = Object.keys(raw as Record<string, unknown>)[0]?.toLowerCase()
    if (key === 'yes') return 'yes'
    if (key === 'no') return 'no'
  }
  return 'abstain'
}

function decodeProposal(raw: unknown): Proposal {
  const p = raw as Record<string, unknown>
  return {
    id: Number(p.id),
    proposer: (p.proposer as { toString(): string }).toString(),
    title: p.title?.toString() ?? '',
    token: (p.token as { toString(): string }).toString(),
    amount: BigInt(p.amount as bigint),
    recipient: (p.recipient as { toString(): string }).toString(),
    yesVotes: BigInt(p.yes_votes as bigint),
    noVotes: BigInt(p.no_votes as bigint),
    abstainVotes: BigInt(p.abstain_votes as bigint),
    status: (Object.keys(p.status as Record<string, unknown>)[0] as Proposal['status']) ?? 'Active',
    startTime: Number(p.start_time),
    endTime: Number(p.end_time),
    votes: ((p.votes as unknown[]) ?? []).map((v) => {
      const vr = v as Record<string, unknown>
      return {
        voter: (vr.voter as { toString(): string }).toString(),
        choice: decodeVoteChoice(vr.choice),
        timestamp: Number(vr.timestamp),
      }
    }),
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useGovernance() {
  const { publicKey, isConnected } = useFreighter()
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [config, setConfig] = useState<GovernanceConfig | null>(null)
  const [members, setMembers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // ── Fetch all proposals from contract ───────────────────────────────────────
  const fetchProposals = useCallback(async () => {
    if (!CONTRACTS.governance) return
    const server = getSorobanServer()

    try {
      const countResult = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase,
        })
          .addOperation(new Contract(CONTRACTS.governance).call('get_proposal_count'))
          .build(),
      )
      if ('error' in countResult) return

      const count = scValToNative(countResult.result!.retval) as number
      const fetched: Proposal[] = []

      for (let i = 0; i < count; i++) {
        const propResult = await server.simulateTransaction(
          new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
            fee: '100',
            networkPassphrase: NETWORK.networkPassphrase,
          })
            .addOperation(
              new Contract(CONTRACTS.governance).call(
                'get_proposal',
                nativeToScVal(i, { type: 'u32' }),
              ),
            )
            .build(),
        )
        if (!('error' in propResult) && propResult.result?.retval) {
          fetched.push(decodeProposal(scValToNative(propResult.result.retval)))
        }
      }
      setProposals(fetched.reverse())
    } catch (err) {
      console.error('Failed to fetch proposals:', err)
    }
  }, [])

  // ── Fetch governance config ─────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    if (!CONTRACTS.governance) return
    const server = getSorobanServer()
    try {
      const result = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase,
        })
          .addOperation(new Contract(CONTRACTS.governance).call('get_config'))
          .build(),
      )
      if (!('error' in result) && result.result?.retval) {
        const raw = scValToNative(result.result.retval) as Record<string, unknown>
        setConfig({
          quorumPercentage: Number(raw.quorum_percentage),
          votingDuration: BigInt(raw.voting_duration as bigint),
          gracePeriod: BigInt(raw.grace_period as bigint),
          memberCount: Number(raw.member_count),
          totalWeight: BigInt(raw.total_weight as bigint),
        })
      }
    } catch (err) {
      console.error('Failed to fetch governance config:', err)
    }
  }, [])

  // ── Fetch member list ───────────────────────────────────────────────────────
  const fetchMembers = useCallback(async () => {
    if (!CONTRACTS.governance) return
    const server = getSorobanServer()
    try {
      const result = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase,
        })
          .addOperation(new Contract(CONTRACTS.governance).call('get_members'))
          .build(),
      )
      if (!('error' in result) && result.result?.retval) {
        const raw = scValToNative(result.result.retval) as unknown[]
        setMembers(raw.map((m) => (m as { toString(): string }).toString()))
      }
    } catch (err) {
      console.error('Failed to fetch members:', err)
    }
  }, [])

  // ── Create proposal ─────────────────────────────────────────────────────────
  const createProposal = useCallback(
    async (title: string, token: string, amount: number, recipient: string) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!CONTRACTS.governance) throw new Error('Governance contract not configured')

      setIsLoading(true)
      setError(null)
      try {
        const { xdr: txXdr } = await buildTransaction({
          contractId: CONTRACTS.governance,
          method: 'create_proposal',
          args: [
            addressToScVal(publicKey),
            nativeToScVal(title, { type: 'symbol' }),
            addressToScVal(token),
            nativeToScVal(BigInt(amount), { type: 'i128' }),
            addressToScVal(recipient),
          ],
          publicKey,
        })

        const signedXdr = await signTransaction(txXdr, {
          networkPassphrase: NETWORK.networkPassphrase,
        })

        const server = getSorobanServer()
        const sendResult = await server.sendTransaction(
          (await import('@stellar/stellar-sdk')).TransactionBuilder.fromXDR(
            signedXdr,
            NETWORK.networkPassphrase,
          ),
        )
        if (sendResult.status === 'ERROR') throw new Error('Transaction submission failed')

        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2_000))
          const status = await server.getTransaction(sendResult.hash)
          if (status.status === 'SUCCESS') break
          if (status.status === 'FAILED') throw new Error('Transaction failed')
        }

        await fetchProposals()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, fetchProposals],
  )

  // ── Vote on a proposal ──────────────────────────────────────────────────────
  const vote = useCallback(
    async (proposalId: number, choice: VoteChoice) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!CONTRACTS.governance) throw new Error('Governance contract not configured')

      setIsLoading(true)
      setError(null)
      try {
        // Encode VoteChoice as an enum variant (ScvVec with a symbol key)
        const choiceVariant = choice.charAt(0).toUpperCase() + choice.slice(1) // "Yes" | "No" | "Abstain"
        const choiceScVal = xdr.ScVal.scvVec([
          xdr.ScVal.scvSymbol(choiceVariant),
        ])

        const { xdr: txXdr } = await buildTransaction({
          contractId: CONTRACTS.governance,
          method: 'vote',
          args: [
            addressToScVal(publicKey),
            nativeToScVal(proposalId, { type: 'u32' }),
            choiceScVal,
          ],
          publicKey,
        })

        const signedXdr = await signTransaction(txXdr, {
          networkPassphrase: NETWORK.networkPassphrase,
        })

        const server = getSorobanServer()
        const sendResult = await server.sendTransaction(
          (await import('@stellar/stellar-sdk')).TransactionBuilder.fromXDR(
            signedXdr,
            NETWORK.networkPassphrase,
          ),
        )
        if (sendResult.status === 'ERROR') throw new Error('Transaction submission failed')

        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2_000))
          const status = await server.getTransaction(sendResult.hash)
          if (status.status === 'SUCCESS') break
          if (status.status === 'FAILED') throw new Error('Transaction failed')
        }

        await fetchProposals()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, fetchProposals],
  )

  // ── Finalize ────────────────────────────────────────────────────────────────
  const finalize = useCallback(
    async (proposalId: number) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!CONTRACTS.governance) throw new Error('Governance contract not configured')

      setIsLoading(true)
      setError(null)
      try {
        const { xdr: txXdr } = await buildTransaction({
          contractId: CONTRACTS.governance,
          method: 'finalize_proposal',
          args: [nativeToScVal(proposalId, { type: 'u32' })],
          publicKey,
        })

        const signedXdr = await signTransaction(txXdr, {
          networkPassphrase: NETWORK.networkPassphrase,
        })

        const server = getSorobanServer()
        const sendResult = await server.sendTransaction(
          (await import('@stellar/stellar-sdk')).TransactionBuilder.fromXDR(
            signedXdr,
            NETWORK.networkPassphrase,
          ),
        )
        if (sendResult.status === 'ERROR') throw new Error('Transaction submission failed')

        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2_000))
          const status = await server.getTransaction(sendResult.hash)
          if (status.status === 'SUCCESS') break
          if (status.status === 'FAILED') throw new Error('Transaction failed')
        }

        await fetchProposals()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, fetchProposals],
  )

  // ── Execute ─────────────────────────────────────────────────────────────────
  const execute = useCallback(
    async (proposalId: number) => {
      if (!publicKey) throw new Error('Wallet not connected')
      if (!CONTRACTS.governance) throw new Error('Governance contract not configured')

      setIsLoading(true)
      setError(null)
      try {
        const { xdr: txXdr } = await buildTransaction({
          contractId: CONTRACTS.governance,
          method: 'execute_proposal',
          args: [nativeToScVal(proposalId, { type: 'u32' })],
          publicKey,
        })

        const signedXdr = await signTransaction(txXdr, {
          networkPassphrase: NETWORK.networkPassphrase,
        })

        const server = getSorobanServer()
        const sendResult = await server.sendTransaction(
          (await import('@stellar/stellar-sdk')).TransactionBuilder.fromXDR(
            signedXdr,
            NETWORK.networkPassphrase,
          ),
        )
        if (sendResult.status === 'ERROR') throw new Error('Transaction submission failed')

        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2_000))
          const status = await server.getTransaction(sendResult.hash)
          if (status.status === 'SUCCESS') break
          if (status.status === 'FAILED') throw new Error('Transaction failed')
        }

        await fetchProposals()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [publicKey, fetchProposals],
  )

  useEffect(() => {
    fetchProposals()
    fetchConfig()
    fetchMembers()
  }, [fetchProposals, fetchConfig, fetchMembers])

  return {
    proposals,
    members,
    config,
    isLoading,
    error,
    isConnected,
    publicKey,
    createProposal,
    vote,
    finalize,
    execute,
    refresh: fetchProposals,
  }
}

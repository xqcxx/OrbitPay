"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { Loader2, CheckCircle2, XCircle, ChevronRight, Coins } from 'lucide-react'

interface Stream {
    id: string
    sender: string
    token: string
    claimable: number
    totalStreamed: number
    startDate: string
    endDate: string
}

// Mock streams data — replace with live contract reads
const MOCK_STREAMS: Stream[] = [
    {
        id: 'stream-001',
        sender: 'GBRT...XKR4',
        token: 'XLM',
        claimable: 320.5,
        totalStreamed: 1280.0,
        startDate: '2025-01-01',
        endDate: '2026-01-01',
    },
    {
        id: 'stream-002',
        sender: 'GCMT...WX2Z',
        token: 'USDC',
        claimable: 85.0,
        totalStreamed: 500.0,
        startDate: '2025-03-01',
        endDate: '2025-12-31',
    },
]

type ClaimStatus = 'idle' | 'confirming' | 'submitting' | 'success' | 'error'

function ConfirmModal({
    stream,
    onConfirm,
    onCancel,
    status,
}: {
    stream: Stream
    onConfirm: () => void
    onCancel: () => void
    status: ClaimStatus
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-stellar-surface border border-stellar-border rounded-2xl p-8 w-full max-w-md shadow-xl">
                {status === 'success' ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative">
                            <CheckCircle2 className="h-16 w-16 text-green-400" />
                            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
                        </div>
                        <p className="text-white text-xl font-bold">Claimed successfully!</p>
                        <p className="text-gray-400 text-sm">
                            <span className="text-green-400 font-semibold">{stream.claimable.toFixed(4)} {stream.token}</span> has been sent to your wallet
                        </p>
                        <button onClick={onCancel} className="mt-2 px-6 py-2 rounded-lg border border-stellar-border text-gray-400 hover:text-white text-sm">Close</button>
                    </div>
                ) : status === 'error' ? (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <XCircle className="h-14 w-14 text-red-400" />
                        <p className="text-white text-lg font-bold">Claim failed</p>
                        <p className="text-gray-400 text-sm">Transaction was rejected or timed out. Please try again.</p>
                        <button onClick={onCancel} className="px-6 py-2 rounded-lg border border-stellar-border text-gray-400 hover:text-white text-sm">Dismiss</button>
                    </div>
                ) : (
                    <>
                        <h3 className="text-white text-xl font-bold mb-1">Confirm Claim</h3>
                        <p className="text-gray-400 text-sm mb-6">You are about to claim accrued tokens from this stream.</p>
                        <div className="bg-[#0D1117] border border-stellar-border rounded-xl p-4 mb-6 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Stream ID</span>
                                <span className="text-gray-200 font-mono">{stream.id}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Claimable Amount</span>
                                <span className="text-green-400 font-semibold">{stream.claimable.toFixed(4)} {stream.token}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Sender</span>
                                <span className="text-gray-200 font-mono">{stream.sender}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-stellar-border text-gray-400 hover:text-white text-sm transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={status === 'submitting'}
                                className="flex-1 py-2.5 rounded-lg bg-stellar-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
                            >
                                {status === 'submitting' ? (
                                    <><Loader2 className="h-4 w-4 animate-spin" /> Claiming…</>
                                ) : (
                                    <>Claim {stream.claimable.toFixed(2)} {stream.token} <ChevronRight className="h-4 w-4" /></>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function StreamCard({
    stream,
    onClaim,
}: {
    stream: Stream
    onClaim: (s: Stream) => void
}) {
    const pct = Math.min((stream.claimable / stream.totalStreamed) * 100, 100)
    return (
        <div className="bg-stellar-surface border border-stellar-border rounded-xl p-5 flex flex-col gap-4 hover:border-stellar-primary/50 transition-colors">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-xs font-semibold uppercase tracking-widest mb-1">From</p>
                    <p className="text-white font-mono text-sm">{stream.sender}</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-stellar-primary/20 text-stellar-secondary text-xs font-semibold">{stream.token}</span>
            </div>
            <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Claimable</span>
                    <span className="text-green-400 font-semibold">{stream.claimable.toFixed(4)} {stream.token}</span>
                </div>
                <div className="w-full bg-[#0D1117] rounded-full h-2">
                    <div
                        className="bg-gradient-to-r from-stellar-primary to-stellar-secondary h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{stream.startDate}</span>
                    <span>{stream.endDate}</span>
                </div>
            </div>
            <button
                onClick={() => onClaim(stream)}
                className="w-full py-2.5 rounded-lg bg-stellar-primary text-white font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            >
                <Coins className="h-4 w-4" />
                Claim {stream.claimable.toFixed(2)} {stream.token}
            </button>
        </div>
    )
}

// Polling hook for live claimable balance
function useLiveClaimable(initial: number) {
    const [claimable, setClaimable] = useState(initial)
    useEffect(() => {
        const id = setInterval(() => {
            // Simulate slow accrual
            setClaimable((c) => parseFloat((c + Math.random() * 0.001).toFixed(6)))
        }, 3000)
        return () => clearInterval(id)
    }, [])
    return claimable
}

export function StreamClaimFlow() {
    const [streams, setStreams] = useState<Stream[]>(MOCK_STREAMS)
    const [selected, setSelected] = useState<Stream | null>(null)
    const [claimStatus, setClaimStatus] = useState<ClaimStatus>('idle')
    const liveClaimable0 = useLiveClaimable(streams[0]?.claimable ?? 0)

    const handleClaim = useCallback(async () => {
        if (!selected) return
        setClaimStatus('submitting')
        await new Promise((res) => setTimeout(res, 1800))
        setClaimStatus('success')
        // Zero out claimable on the stream card after success
        setStreams((prev) =>
            prev.map((s) => (s.id === selected.id ? { ...s, claimable: 0 } : s))
        )
    }, [selected])

    const handleClose = useCallback(() => {
        setSelected(null)
        setClaimStatus('idle')
    }, [])

    // Reflect live polling into the first stream
    const displayStreams = streams.map((s, i) =>
        i === 0 ? { ...s, claimable: liveClaimable0 } : s
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-gray-400 text-sm border border-stellar-border/50 bg-stellar-surface/60 rounded-xl px-4 py-3">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Claimable balances update in real-time every 3 seconds
            </div>

            {displayStreams.length === 0 ? (
                <div className="border border-dashed border-stellar-border rounded-xl p-12 text-center text-gray-500">
                    No active streams to claim from.
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {displayStreams.map((s) => (
                        <StreamCard key={s.id} stream={s} onClaim={(stream) => { setSelected(stream); setClaimStatus('confirming') }} />
                    ))}
                </div>
            )}

            {selected && claimStatus !== 'idle' && (
                <ConfirmModal
                    stream={selected}
                    onConfirm={handleClaim}
                    onCancel={handleClose}
                    status={claimStatus}
                />
            )}
        </div>
    )
}

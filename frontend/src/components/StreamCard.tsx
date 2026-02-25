'use client'

import { useEffect, useState } from 'react'
import { Stream } from '@/hooks/usePayrollStream'
import { ArrowRight, Play, Pause, XCircle, CheckCircle2 } from 'lucide-react'

interface StreamCardProps {
    stream: Stream
}

export default function StreamCard({ stream }: StreamCardProps) {
    const [claimable, setClaimable] = useState(stream.amountStreamed)

    useEffect(() => {
        if (stream.status !== 'Active') return

        const interval = setInterval(() => {
            const now = Date.now()
            if (now >= stream.endTime) {
                setClaimable(stream.totalAmount)
                clearInterval(interval)
            } else {
                // Calculate amount streamed based on time elapsed instead of basic increment
                // to avoid drifting. However, for a simple live ticker, we can increment based on interval.
                // stream.ratePerSecond is per second. Interval is every 100ms for smooth UI.
                const elapsedSeconds = (now - stream.startTime) / 1000
                const newClaimable = Math.min(
                    stream.totalAmount,
                    elapsedSeconds * stream.ratePerSecond
                )
                setClaimable(newClaimable)
            }
        }, 100)

        return () => clearInterval(interval)
    }, [stream])

    const progressPercent = Math.min(
        100,
        Math.max(0, (claimable / stream.totalAmount) * 100)
    )

    const StatusIcon = {
        Active: Play,
        Paused: Pause,
        Cancelled: XCircle,
        Completed: CheckCircle2,
    }[stream.status]

    const statusColors = {
        Active: 'bg-green-500/10 text-green-500 border-green-500/20',
        Paused: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
        Cancelled: 'bg-red-500/10 text-red-500 border-red-500/20',
        Completed: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    }

    return (
        <div className="bg-gray-800/40 border border-gray-700/50 hover:bg-gray-800/60 transition-colors p-6 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 text-xs font-semibold rounded-full border flex items-center gap-1.5 ${statusColors[stream.status]}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {stream.status}
                    </div>
                    <span className="text-gray-400 text-sm font-mono truncate max-w-[120px]" title={stream.id}>
                        {stream.id}
                    </span>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold font-mono tracking-tight glow-text text-white">
                        {claimable.toFixed(4)} <span className="text-sm font-semibold text-gray-500">{stream.token}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        of {stream.totalAmount} {stream.token}
                    </div>
                </div>
            </div>

            <div className="bg-gray-900/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Sender</span>
                    <span className="text-sm font-mono font-medium text-gray-300">{stream.sender}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600" />
                <div className="flex flex-col text-right">
                    <span className="text-xs text-gray-500">Recipient</span>
                    <span className="text-sm font-mono font-medium text-gray-300">{stream.recipient}</span>
                </div>
            </div>

            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-gray-400 font-medium">
                    <span>Progress</span>
                    <span>{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-700/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-100 ease-linear ${stream.status === 'Active' ? 'bg-green-500' :
                                stream.status === 'Paused' ? 'bg-yellow-500' :
                                    stream.status === 'Cancelled' ? 'bg-red-500' :
                                        'bg-blue-500'
                            }`}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

'use client'

import { useEffect, useState } from 'react'
import { Stream, usePayrollStream } from '@/hooks/usePayrollStream'
import { ArrowRight, Play, Pause, XCircle, CheckCircle2, Wallet, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"
import { cn } from "@/lib/utils"
import StreamClaimFlow from './StreamClaimFlow'

interface StreamCardProps {
    stream: Stream
    view?: 'grid' | 'list'
}

export default function StreamCard({ stream, view = 'grid' }: StreamCardProps) {
    const { cancelStream } = usePayrollStream()
    const [claimable, setClaimable] = useState(parseFloat(stream.amountStreamed))
    const [currentTime, setCurrentTime] = useState(Date.now())

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (stream.status !== 'Active') {
            setClaimable(parseFloat(stream.amountStreamed))
            return
        }

        const now = currentTime / 1000
        if (now >= stream.endTime) {
            setClaimable(parseFloat(stream.totalAmount))
        } else if (now <= stream.startTime) {
            setClaimable(0)
        } else {
            const elapsed = now - stream.startTime
            const rate = parseFloat(stream.ratePerSecond)
            const projected = elapsed * rate
            setClaimable(Math.min(parseFloat(stream.totalAmount), projected))
        }
    }, [currentTime, stream])

    const progressPercent = Math.min(
        100,
        Math.max(0, (claimable / parseFloat(stream.totalAmount)) * 100)
    )

    const StatusIcon = {
        Active: Play,
        Paused: Pause,
        Cancelled: XCircle,
        Completed: CheckCircle2,
    }[stream.status] || Play

    const statusVariants = {
        Active: 'success',
        Paused: 'warning',
        Cancelled: 'destructive',
        Completed: 'default',
    } as const

    if (view === 'list') {
        return (
            <div className="group bg-gray-900/40 hover:bg-gray-900/60 border border-gray-800 rounded-2xl p-4 flex items-center justify-between transition-all">
                <div className="flex items-center gap-4 flex-1">
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center border",
                        stream.status === 'Active' ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-gray-800 border-gray-700 text-gray-500"
                    )}>
                        <StatusIcon size={18} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">Stream #{stream.id.slice(0, 8)}</span>
                        <span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter">
                            {stream.recipient.slice(0, 6)}...{stream.recipient.slice(-4)}
                        </span>
                    </div>
                </div>

                <div className="flex-[2] px-8">
                    <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        <div 
                            className={cn("h-full transition-all duration-1000", stream.status === 'Active' ? "bg-blue-500" : "bg-gray-600")} 
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                </div>

                <div className="flex-1 text-right pr-6">
                    <span className="text-sm font-black text-white font-mono">{claimable.toFixed(4)}</span>
                    <span className="text-[10px] text-gray-500 font-bold ml-1">{stream.token.slice(0, 4)}</span>
                </div>

                <div className="flex items-center gap-2">
                    <StreamClaimFlow stream={stream} claimableAmount={claimable.toString()} />
                    <Button variant="ghost" size="sm" onClick={() => cancelStream(stream.id)} className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-gray-500 hover:text-red-400">
                        <Trash2 size={14} />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <Card className="group hover:border-blue-500/30 transition-all overflow-hidden bg-gray-900/40">
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <Badge variant={statusVariants[stream.status]} className="gap-1.5 py-1 px-3">
                        <StatusIcon size={12} />
                        {stream.status}
                    </Badge>
                    <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">ID: {stream.id.slice(0, 8)}</span>
                </div>

                <div className="space-y-1 text-center py-2">
                    <div className="text-3xl font-black text-white font-mono tracking-tighter italic">
                        {claimable.toFixed(6)}
                    </div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Claimable <span className="text-blue-400">{stream.token.slice(0, 6)}</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500">
                        <span>Progress</span>
                        <span>{progressPercent.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden p-0.5">
                        <div 
                            className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                stream.status === 'Active' ? "bg-gradient-to-r from-blue-600 to-indigo-500" : "bg-gray-600"
                            )} 
                            style={{ width: `${progressPercent}%` }} 
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-600 font-medium">
                        <span>0.00</span>
                        <span>{parseFloat(stream.totalAmount).toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                    <div className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Recipient</span>
                        <span className="text-[11px] font-mono text-gray-400">{stream.recipient.slice(0, 8)}...</span>
                    </div>
                    <ArrowRight size={14} className="text-gray-700" />
                    <div className="flex flex-col gap-1 text-right">
                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Release Rate</span>
                        <span className="text-[11px] font-bold text-blue-400">{parseFloat(stream.ratePerSecond).toFixed(6)}/s</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <StreamClaimFlow stream={stream} claimableAmount={claimable.toString()} />
                    {stream.status === 'Active' && (
                        <Button variant="outline" size="sm" onClick={() => cancelStream(stream.id)} className="flex-1 rounded-xl h-10 border-gray-800 text-gray-500 hover:text-red-400 gap-2">
                            <XCircle size={14} />
                            Cancel
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}

'use client'

import React from 'react';
import { Info, Clock, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface VestingTimelineProps {
    schedule: {
        startTime: number;
        cliffDuration: number;
        totalDuration: number;
        totalAmount: string;
        claimedAmount: string;
    }
}

export default function VestingTimeline({ schedule }: VestingTimelineProps) {
    const { startTime, cliffDuration, totalDuration, totalAmount, claimedAmount } = schedule;
    const now = Math.floor(Date.now() / 1000);
    const endTime = startTime + totalDuration;
    const cliffTime = startTime + cliffDuration;

    const getProgress = (time: number) => {
        const elapsed = time - startTime;
        return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    };

    const currentPercent = getProgress(now);
    const cliffPercent = getProgress(cliffTime);

    const total = parseFloat(totalAmount);
    const claimed = parseFloat(claimedAmount);
    
    // Calculate vested amount (rough estimate for UI)
    let vested = 0;
    if (now >= cliffTime) {
        const elapsedSinceStart = now - startTime;
        vested = (elapsedSinceStart / totalDuration) * total;
        vested = Math.min(total, vested);
    }

    const claimedPercent = total > 0 ? (claimed / total) * 100 : 0;
    const vestedOnlyPercent = total > 0 ? (Math.max(0, vested - claimed) / total) * 100 : 0;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    return (
        <div className="w-full space-y-6">
            <div className="relative pt-6 pb-2">
                {/* Timeline base */}
                <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden flex p-0.5">
                    {/* Claimed */}
                    <div
                        className="h-full bg-blue-500 rounded-l-full transition-all duration-1000"
                        style={{ width: `${claimedPercent}%` }}
                    />
                    {/* Vested but not claimed */}
                    <div
                        className="h-full bg-green-400 transition-all duration-1000"
                        style={{ width: `${vestedOnlyPercent}%` }}
                    />
                </div>

                {/* Cliff Marker */}
                <div 
                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-orange-500/50"
                    style={{ left: `${cliffPercent}%` }}
                >
                    <div className="absolute -top-1 left-[-4px] w-2 h-2 rounded-full bg-orange-500" />
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-widest text-orange-500">Cliff</div>
                </div>

                {/* Current Position */}
                <div 
                    className="absolute top-4 bottom-0 w-px bg-white/30 z-10"
                    style={{ left: `${currentPercent}%` }}
                >
                    <div className="absolute -bottom-1 left-[-4px] w-2 h-2 rounded-full bg-white shadow-xl" />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Start Date</p>
                    <p className="text-[10px] font-bold text-gray-400">{formatDate(startTime)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">Cliff Date</p>
                    <p className="text-[10px] font-bold text-orange-400/80">{formatDate(cliffTime)}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-600">End Date</p>
                    <p className="text-[10px] font-bold text-gray-400">{formatDate(endTime)}</p>
                </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Claimed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Vested</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-gray-800" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Locked</span>
                    </div>
                </div>
                
                <div className="flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 rounded-full border border-purple-500/20">
                    <Info size={10} className="text-purple-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-400">
                        {Math.floor(totalDuration / (30 * 24 * 3600))} Month Plan
                    </span>
                </div>
            </div>
        </div>
    );
}

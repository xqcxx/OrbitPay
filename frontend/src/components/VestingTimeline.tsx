'use client'

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';

interface VestingTimelineProps {
    startTime: number; // Unix timestamp
    cliffDuration: number; // Seconds
    totalDuration: number; // Seconds
    totalAmount: bigint;
    vestedAmount: bigint;
    claimedAmount: bigint;
}

export default function VestingTimeline({
    startTime,
    cliffDuration,
    totalDuration,
    totalAmount,
    vestedAmount,
    claimedAmount,
}: VestingTimelineProps) {
    const now = Math.floor(Date.now() / 1000);
    const endTime = startTime + totalDuration;
    const cliffTime = startTime + cliffDuration;

    // Percentage calculations for markers and segments
    const getProgress = (time: number) => {
        const elapsed = time - startTime;
        return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    };

    const currentPercent = getProgress(now);
    const cliffPercent = getProgress(cliffTime);

    // Segment widths
    const total = Number(totalAmount);
    const claimedPercent = total > 0 ? (Number(claimedAmount) / total) * 100 : 0;
    const vestedOnlyPercent = total > 0 ? ((Number(vestedAmount) - Number(claimedAmount)) / total) * 100 : 0;
    const lockedPercent = 100 - claimedPercent - vestedOnlyPercent;

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: '2-digit',
        });
    };

    return (
        <div className="w-full space-y-8 py-4">
            {/* Timeline Bar */}
            <div className="relative group">
                <div className="h-6 bg-gray-800/50 rounded-full overflow-hidden flex border border-gray-700/50 backdrop-blur-sm">
                    {/* Claimed (Blue) */}
                    <div
                        className="h-full bg-gradient-to-r from-blue-600 to-blue-500 transition-all duration-700 ease-out relative"
                        style={{ width: `${claimedPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/10 animate-pulse-slow" />
                    </div>

                    {/* Vested but not claimed (Green) */}
                    <div
                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-700 ease-out"
                        style={{ width: `${vestedOnlyPercent}%` }}
                    />

                    {/* Locked (Gray) */}
                    <div
                        className="h-full bg-transparent transition-all duration-700 ease-out"
                        style={{ width: `${lockedPercent}%` }}
                    />
                </div>

                {/* Current Position Marker overlay */}
                <div
                    className="absolute top-[-8px] bottom-[-8px] w-0.5 bg-white/40 z-10 transition-all duration-700"
                    style={{ left: `${currentPercent}%` }}
                >
                    <div className="absolute top-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-glow" />
                    <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 text-[10px] font-bold text-white uppercase tracking-tighter whitespace-nowrap bg-black/40 px-1 rounded">
                        Now
                    </div>
                </div>

                {/* Cliff Marker */}
                <div
                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-orange-400/50 z-0"
                    style={{ left: `${cliffPercent}%` }}
                >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-orange-400 font-bold uppercase tracking-tight">
                        Cliff
                    </div>
                </div>
            </div>

            {/* Date Labels */}
            <div className="flex justify-between items-center text-[10px] text-gray-500 font-medium uppercase tracking-widest px-1">
                <div className="flex flex-col items-start gap-1">
                    <span className="text-gray-600">Start</span>
                    <span className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">{formatDate(startTime)}</span>
                </div>

                <div className="flex flex-col items-center gap-1">
                    <span className="text-gray-600">Cliff</span>
                    <span className="text-orange-400/80 bg-orange-900/20 px-1.5 py-0.5 rounded">{formatDate(cliffTime)}</span>
                </div>

                <div className="flex flex-col items-end gap-1 text-right">
                    <span className="text-gray-600">End</span>
                    <span className="text-gray-300 bg-gray-800 px-1.5 py-0.5 rounded">{formatDate(endTime)}</span>
                </div>
            </div>

            {/* Legend & Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-800/50">
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span>Claimed</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Vested</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-700" />
                        <span>Locked</span>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-purple-400 font-bold bg-purple-900/10 px-2 py-1 rounded-lg border border-purple-500/20">
                    <Info size={14} className="opacity-70" />
                    <span>Vesting linearly over {(totalDuration / (3600 * 24 * 30)).toFixed(0)} months</span>
                </div>
            </div>
        </div>
    );
}

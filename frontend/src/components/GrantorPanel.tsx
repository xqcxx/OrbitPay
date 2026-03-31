'use client'

import React, { useState, useEffect } from 'react';
import { Shield, AlertCircle, Loader2, Ban, CheckCircle2, Clock } from 'lucide-react';
import RevokeModal from './RevokeModal';
import { useFreighter } from '@/contexts/FreighterContext';

interface VestingSchedule {
    id: number;
    label: string;
    grantor: string;
    beneficiary: string;
    token: string;
    total_amount: bigint;
    claimed_amount: bigint;
    start_time: number;
    cliff_duration: number;
    total_duration: number;
    status: number; // 0: Active, 1: Revoked, 2: FullyClaimed
    revocable: boolean;
}

export default function GrantorPanel() {
    const { publicKey, isConnected } = useFreighter();
    const [schedules, setSchedules] = useState<VestingSchedule[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSchedule, setSelectedSchedule] = useState<VestingSchedule | null>(null);
    const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

    useEffect(() => {
        if (isConnected && publicKey) {
            fetchGrantorSchedules();
        }
    }, [isConnected, publicKey]);

    async function fetchGrantorSchedules() {
        setLoading(true);
        setError(null);

        try {
            // TODO: Replace with actual contract call to get_schedules_by_grantor
            // For now, using mock data for UI development
            
            // Simulate API delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const mockSchedules: VestingSchedule[] = [
                {
                    id: 1,
                    label: 'Team Member A',
                    grantor: publicKey || '',
                    beneficiary: 'GBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                    token: 'ORBT',
                    total_amount: BigInt(100000000000), // 10,000 tokens
                    claimed_amount: BigInt(20000000000), // 2,000 tokens
                    start_time: Math.floor(Date.now() / 1000) - (365 * 24 * 3600), // 1 year ago
                    cliff_duration: 365 * 24 * 3600, // 1 year
                    total_duration: 4 * 365 * 24 * 3600, // 4 years
                    status: 0, // Active
                    revocable: true,
                },
                {
                    id: 2,
                    label: 'Advisor Grant',
                    grantor: publicKey || '',
                    beneficiary: 'GCYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
                    token: 'ORBT',
                    total_amount: BigInt(50000000000), // 5,000 tokens
                    claimed_amount: BigInt(0),
                    start_time: Math.floor(Date.now() / 1000) - (180 * 24 * 3600), // 6 months ago
                    cliff_duration: 365 * 24 * 3600, // 1 year
                    total_duration: 2 * 365 * 24 * 3600, // 2 years
                    status: 0, // Active
                    revocable: true,
                },
                {
                    id: 3,
                    label: 'Investor Allocation',
                    grantor: publicKey || '',
                    beneficiary: 'GDZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
                    token: 'ORBT',
                    total_amount: BigInt(200000000000), // 20,000 tokens
                    claimed_amount: BigInt(50000000000), // 5,000 tokens
                    start_time: Math.floor(Date.now() / 1000) - (2 * 365 * 24 * 3600), // 2 years ago
                    cliff_duration: 0, // No cliff
                    total_duration: 3 * 365 * 24 * 3600, // 3 years
                    status: 0, // Active
                    revocable: false, // Not revocable
                },
                {
                    id: 4,
                    label: 'Former Employee',
                    grantor: publicKey || '',
                    beneficiary: 'GEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                    token: 'ORBT',
                    total_amount: BigInt(80000000000), // 8,000 tokens
                    claimed_amount: BigInt(30000000000), // 3,000 tokens
                    start_time: Math.floor(Date.now() / 1000) - (1.5 * 365 * 24 * 3600), // 1.5 years ago
                    cliff_duration: 365 * 24 * 3600, // 1 year
                    total_duration: 4 * 365 * 24 * 3600, // 4 years
                    status: 1, // Revoked
                    revocable: true,
                },
            ];

            setSchedules(mockSchedules);
        } catch (err: any) {
            console.error('Fetch grantor schedules failed:', err);
            setError(err.message || 'Failed to fetch vesting schedules');
        } finally {
            setLoading(false);
        }
    }

    function handleRevokeClick(schedule: VestingSchedule) {
        setSelectedSchedule(schedule);
        setIsRevokeModalOpen(true);
    }

    function handleRevokeSuccess() {
        // Refresh the schedules list
        fetchGrantorSchedules();
    }

    function formatTokenAmount(amount: bigint): string {
        return (Number(amount) / 1e7).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }

    function calculateVestedAmount(schedule: VestingSchedule): bigint {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - schedule.start_time;
        
        if (elapsed < schedule.cliff_duration) {
            return BigInt(0);
        } else if (elapsed >= schedule.total_duration) {
            return schedule.total_amount;
        } else {
            const vestingProgress = elapsed - schedule.cliff_duration;
            const vestingDuration = schedule.total_duration - schedule.cliff_duration;
            return (schedule.total_amount * BigInt(vestingProgress)) / BigInt(vestingDuration);
        }
    }

    function getStatusBadge(status: number) {
        switch (status) {
            case 0: // Active
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-lg text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                    </span>
                );
            case 1: // Revoked
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 rounded-lg text-xs font-medium">
                        <Ban className="w-3 h-3" />
                        Revoked
                    </span>
                );
            case 2: // FullyClaimed
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded-lg text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Completed
                    </span>
                );
            default:
                return null;
        }
    }

    if (!isConnected) {
        return (
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center">
                <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h3>
                <p className="text-gray-400">
                    Connect your wallet to view and manage vesting schedules you've created.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-3xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-purple-500/10 rounded-xl">
                        <Shield className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">Grantor Dashboard</h2>
                        <p className="text-gray-300">
                            Manage vesting schedules you've created. Revoke schedules to recover unvested tokens.
                        </p>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-red-500 mb-1">Error Loading Schedules</h4>
                        <p className="text-sm text-gray-300">{error}</p>
                    </div>
                </div>
            )}

            {/* Schedules List */}
            {!loading && !error && schedules.length === 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center">
                    <Clock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Vesting Schedules</h3>
                    <p className="text-gray-400">
                        You haven't created any vesting schedules yet.
                    </p>
                </div>
            )}

            {!loading && !error && schedules.length > 0 && (
                <div className="space-y-4">
                    {schedules.map((schedule) => {
                        const vestedAmount = calculateVestedAmount(schedule);
                        const unvestedAmount = schedule.total_amount - vestedAmount;
                        const vestingProgress = schedule.total_amount > 0 
                            ? Number((vestedAmount * BigInt(100)) / schedule.total_amount)
                            : 0;

                        return (
                            <div
                                key={schedule.id}
                                className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-bold text-white">{schedule.label}</h3>
                                            {getStatusBadge(schedule.status)}
                                            {schedule.revocable && schedule.status === 0 && (
                                                <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-lg text-xs font-medium">
                                                    Revocable
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400 font-mono">
                                            Beneficiary: {schedule.beneficiary.slice(0, 12)}...{schedule.beneficiary.slice(-12)}
                                        </p>
                                    </div>
                                    
                                    {schedule.revocable && schedule.status === 0 && (
                                        <button
                                            onClick={() => handleRevokeClick(schedule)}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                                        >
                                            <Ban className="w-4 h-4" />
                                            Revoke
                                        </button>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-400">Vesting Progress</span>
                                        <span className="text-white font-medium">{vestingProgress}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                                            style={{ width: `${vestingProgress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Token Amounts */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Total Amount</p>
                                        <p className="text-white font-semibold">
                                            {formatTokenAmount(schedule.total_amount)} {schedule.token}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Vested</p>
                                        <p className="text-green-500 font-semibold">
                                            {formatTokenAmount(vestedAmount)} {schedule.token}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Claimed</p>
                                        <p className="text-blue-500 font-semibold">
                                            {formatTokenAmount(schedule.claimed_amount)} {schedule.token}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 mb-1">Unvested</p>
                                        <p className="text-yellow-500 font-semibold">
                                            {formatTokenAmount(unvestedAmount)} {schedule.token}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Revoke Modal */}
            <RevokeModal
                schedule={selectedSchedule}
                isOpen={isRevokeModalOpen}
                onClose={() => {
                    setIsRevokeModalOpen(false);
                    setSelectedSchedule(null);
                }}
                onSuccess={handleRevokeSuccess}
                grantorPublicKey={publicKey || ''}
            />
        </div>
    );
}

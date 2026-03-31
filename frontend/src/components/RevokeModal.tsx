'use client'

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { getSorobanServer, CONTRACTS, buildTransaction, submitTransaction } from '@/lib/network';
import { signTransaction } from '@/lib/wallet';
import * as StellarSdk from '@stellar/stellar-sdk';

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
    status: number;
    revocable: boolean;
}

interface RevokeImpact {
    vestedAmount: bigint;
    unvestedAmount: bigint;
    claimedAmount: bigint;
    tokensToReturn: bigint;
}

interface RevokeModalProps {
    schedule: VestingSchedule | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    grantorPublicKey: string;
}

export default function RevokeModal({ schedule, isOpen, onClose, onSuccess, grantorPublicKey }: RevokeModalProps) {
    const [impact, setImpact] = useState<RevokeImpact | null>(null);
    const [loading, setLoading] = useState(false);
    const [revoking, setRevoking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen && schedule) {
            calculateImpact();
        } else {
            setImpact(null);
            setError(null);
            setSuccess(false);
        }
    }, [isOpen, schedule]);

    function calculateImpact() {
        if (!schedule) return;

        setLoading(true);
        setError(null);

        try {
            const now = Math.floor(Date.now() / 1000);
            const elapsed = now - schedule.start_time;
            
            let vestedAmount = BigInt(0);
            
            if (elapsed < schedule.cliff_duration) {
                // Before cliff - nothing vested
                vestedAmount = BigInt(0);
            } else if (elapsed >= schedule.total_duration) {
                // Fully vested
                vestedAmount = schedule.total_amount;
            } else {
                // Linear vesting after cliff
                const vestingProgress = elapsed - schedule.cliff_duration;
                const vestingDuration = schedule.total_duration - schedule.cliff_duration;
                vestedAmount = (schedule.total_amount * BigInt(vestingProgress)) / BigInt(vestingDuration);
            }

            const unvestedAmount = schedule.total_amount - vestedAmount;
            const tokensToReturn = unvestedAmount;

            setImpact({
                vestedAmount,
                unvestedAmount,
                claimedAmount: schedule.claimed_amount,
                tokensToReturn,
            });
        } catch (err: any) {
            console.error('Calculate impact failed:', err);
            setError(err.message || 'Failed to calculate revocation impact');
        } finally {
            setLoading(false);
        }
    }

    async function handleRevoke() {
        if (!schedule || !impact) return;

        setRevoking(true);
        setError(null);

        try {
            const server = getSorobanServer();
            if (!server) throw new Error('RPC server not configured');

            // Build the revoke transaction
            const grantorAddress = new StellarSdk.Address(grantorPublicKey);
            const scheduleIdScVal = StellarSdk.nativeToScVal(schedule.id, { type: 'u32' });

            const { xdr } = await buildTransaction({
                contractId: CONTRACTS.vesting,
                method: 'revoke',
                args: [grantorAddress.toScVal(), scheduleIdScVal],
                publicKey: grantorPublicKey,
            });

            // Sign the transaction
            const signedXdr = await signTransaction(xdr, 'TESTNET');

            // Submit and wait for confirmation
            const result = await submitTransaction(signedXdr, true);

            if (result.status === 'SUCCESS') {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                throw new Error(`Transaction failed with status: ${result.status}`);
            }
        } catch (err: any) {
            console.error('Revoke failed:', err);
            setError(err.message || 'Failed to revoke vesting schedule');
        } finally {
            setRevoking(false);
        }
    }

    function formatTokenAmount(amount: bigint): string {
        return (Number(amount) / 1e7).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 7,
        });
    }

    if (!schedule) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Revoke Vesting Schedule" size="lg">
            <div className="p-6 space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : success ? (
                    <div className="text-center py-8">
                        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Schedule Revoked Successfully</h3>
                        <p className="text-gray-400">
                            {formatTokenAmount(impact?.tokensToReturn || BigInt(0))} tokens returned to your account
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Warning Banner */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-semibold text-yellow-500 mb-1">Warning: This action cannot be undone</h4>
                                <p className="text-sm text-gray-300">
                                    Revoking this schedule will return unvested tokens to you. Already vested tokens remain claimable by the beneficiary.
                                </p>
                            </div>
                        </div>

                        {/* Schedule Details */}
                        <div className="bg-gray-800/50 rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-white mb-3">Schedule Details</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-400">Label:</span>
                                    <p className="text-white font-medium">{schedule.label}</p>
                                </div>
                                <div>
                                    <span className="text-gray-400">Beneficiary:</span>
                                    <p className="text-white font-mono text-xs">
                                        {schedule.beneficiary.slice(0, 8)}...{schedule.beneficiary.slice(-8)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Impact Summary */}
                        {impact && (
                            <div className="bg-gray-800/50 rounded-xl p-4 space-y-4">
                                <h4 className="font-semibold text-white mb-3">Revocation Impact</h4>
                                
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="text-gray-400">Total Amount:</span>
                                        <span className="text-white font-medium">
                                            {formatTokenAmount(schedule.total_amount)} {schedule.token}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="text-gray-400">Already Vested:</span>
                                        <span className="text-white font-medium">
                                            {formatTokenAmount(impact.vestedAmount)} {schedule.token}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="text-gray-400">Already Claimed:</span>
                                        <span className="text-white font-medium">
                                            {formatTokenAmount(impact.claimedAmount)} {schedule.token}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                                        <span className="text-gray-400">Unvested (to revoke):</span>
                                        <span className="text-yellow-500 font-medium">
                                            {formatTokenAmount(impact.unvestedAmount)} {schedule.token}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-white font-semibold">Tokens Returned to You:</span>
                                        <span className="text-green-500 font-bold text-lg">
                                            +{formatTokenAmount(impact.tokensToReturn)} {schedule.token}
                                        </span>
                                    </div>

                                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-4">
                                        <p className="text-sm text-blue-300">
                                            <strong>Note:</strong> The beneficiary can still claim {formatTokenAmount(impact.vestedAmount - impact.claimedAmount)} {schedule.token} that has already vested.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-500 mb-1">Revocation Failed</h4>
                                    <p className="text-sm text-gray-300">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4">
                            <button
                                onClick={onClose}
                                disabled={revoking}
                                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevoke}
                                disabled={revoking || !impact}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {revoking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Revoking...
                                    </>
                                ) : (
                                    'Confirm Revocation'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

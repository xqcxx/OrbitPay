'use client'

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { getSorobanServer, CONTRACTS, NETWORK } from '@/lib/network';
import { connectWallet, signTransaction } from '@/lib/wallet';
import * as StellarSdk from '@stellar/stellar-sdk';

interface VestingProgress {
    total_amount: bigint;
    vested_amount: bigint;
    claimed_amount: bigint;
    claimable_amount: bigint;
    status: number;
}

interface ClaimModalProps {
    schedule_id: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (amount: string) => void;
}

export default function ClaimModal({ schedule_id, isOpen, onClose, onSuccess }: ClaimModalProps) {
    const [progress, setProgress] = useState<VestingProgress | null>(null);
    const [loading, setLoading] = useState(false);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchProgress();
        }
    }, [isOpen, schedule_id]);

    async function fetchProgress() {
        setLoading(true);
        setError(null);
        try {
            const server = getSorobanServer();
            if (!server) throw new Error('RPC server not configured');

            // Note: In a real implementation, we would use the Soroban SDK to call get_progress
            // Here we simulate the call for the UI demonstration
            // const contract = new StellarSdk.Contract(CONTRACTS.vesting);
            // const tx = ... call get_progress ...

            // Mock data for UI development
            setTimeout(() => {
                setProgress({
                    total_amount: BigInt(10000000000), // 1000 tokens
                    vested_amount: BigInt(6000000000),  // 600 tokens
                    claimed_amount: BigInt(2000000000), // 200 tokens
                    claimable_amount: BigInt(4000000000), // 400 tokens
                    status: 1, // Active
                });
                setLoading(false);
            }, 1000);

        } catch (err: any) {
            console.error('Fetch progress failed:', err);
            setError(err.message || 'Failed to fetch vesting progress');
            setLoading(false);
        }
    }

    async function handleClaim() {
        if (!progress || progress.claimable_amount <= BigInt(0)) return;

        setClaiming(true);
        setError(null);

        try {
            const publicKey = await connectWallet();
            if (!publicKey) throw new Error('Wallet not connected');

            const server = getSorobanServer();
            if (!server) throw new Error('RPC server not configured');

            // 1. Build Transaction
            // This is a placeholder for the actual Soroban transaction building logic
            // const contract = new StellarSdk.Contract(CONTRACTS.vesting);
            // const operation = contract.call('claim', 
            //   StellarSdk.nativeToScVal(publicKey, 'address'),
            //   StellarSdk.nativeToScVal(schedule_id, 'u32')
            // );

            // 2. Sign and Submit
            // const tx = new StellarSdk.TransactionBuilder(...)
            // const xdr = tx.toXDR();
            // const signedXdr = await signTransaction(xdr, NETWORK.networkPassphrase);
            // await server.sendTransaction(new StellarSdk.Transaction(signedXdr, NETWORK.networkPassphrase));

            // Simulate successful claim
            setTimeout(() => {
                const claimedStr = (Number(progress.claimable_amount) / 10 ** 7).toFixed(2);
                setClaiming(false);
                onSuccess(claimedStr);
            }, 2000);

        } catch (err: any) {
            console.error('Claim failed:', err);
            setError(err.message || 'Failed to claim tokens');
            setClaiming(false);
        }
    }

    if (!isOpen) return null;

    const total = progress ? Number(progress.total_amount) / 10 ** 7 : 0;
    const vested = progress ? Number(progress.vested_amount) / 10 ** 7 : 0;
    const claimed = progress ? Number(progress.claimed_amount) / 10 ** 7 : 0;
    const claimable = progress ? Number(progress.claimable_amount) / 10 ** 7 : 0;

    const progressPercent = total > 0 ? (vested / total) * 100 : 0;
    const claimedPercent = total > 0 ? (claimed / total) * 100 : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-800">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-purple-400">⏳</span> Claim Tokens
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-purple-500 mb-4" size={40} />
                            <p className="text-gray-400">Loading vesting details...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-500 shrink-0" size={20} />
                            <p className="text-red-200 text-sm">{error}</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Progress Bar */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Vesting Progress</span>
                                    <span className="text-white font-medium">{progressPercent.toFixed(1)}%</span>
                                </div>
                                <div className="h-4 bg-gray-800 rounded-full overflow-hidden relative">
                                    <div
                                        className="absolute inset-y-0 left-0 bg-purple-600/40 transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                    <div
                                        className="absolute inset-y-0 left-0 bg-purple-500 transition-all duration-500"
                                        style={{ width: `${claimedPercent}%` }}
                                    />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total</p>
                                    <p className="text-lg font-semibold text-white">{total.toLocaleString()} <span className="text-gray-500 text-sm font-normal">TOKENS</span></p>
                                </div>
                                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Vested</p>
                                    <p className="text-lg font-semibold text-white">{vested.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Claimed</p>
                                    <p className="text-lg font-semibold text-white">{claimed.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-800/40 border border-gray-800 rounded-xl p-3">
                                    <p className="text-xs text-purple-400 uppercase font-bold mb-1 font-inter">Claimable</p>
                                    <p className="text-lg font-bold text-purple-300">{claimable.toLocaleString()}</p>
                                </div>
                            </div>

                            {/* Action */}
                            <button
                                onClick={handleClaim}
                                disabled={claiming || claimable <= 0}
                                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${claimable > 0
                                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'
                                        : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                {claiming ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {claimable > 0 ? (
                                            <>Claim {claimable.toLocaleString()} Tokens</>
                                        ) : (
                                            <>Nothing to Claim</>
                                        )}
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-500">
                                Claiming tokens will execute a transaction on Stellar network
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

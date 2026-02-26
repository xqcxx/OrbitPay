"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, Clock, DollarSign, User, Coins, Zap, Timer, ArrowRight, Shield, ShieldCheck } from "lucide-react";
import { useVesting } from "@/hooks/useVesting";
import { StrKey } from "@stellar/stellar-sdk";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface VestingForm {
    beneficiary: string
    token: string
    totalAmount: string
    startDate: string
    startTime: string
    cliffMonths: string
    vestingMonths: string
    revocable: boolean
}

const DEFAULT_FORM: VestingForm = {
    beneficiary: '',
    token: '',
    totalAmount: '',
    startDate: '',
    startTime: '09:00',
    cliffMonths: '',
    vestingMonths: '',
    revocable: true,
}

interface VestingScheduleBuilderProps {
	onSuccess?: () => void;
	onError?: (error: string) => void;
}

export default function VestingScheduleBuilder({ onSuccess, onError }: VestingScheduleBuilderProps) {
    const { createSchedule, isLoading } = useVesting()
    const [form, setForm] = useState<VestingForm>(DEFAULT_FORM)
    const [errors, setErrors] = useState<Partial<VestingForm>>({})

    const availableTokens = [
		{
			symbol: "USDC",
			address: "CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA",
			name: "USD Coin",
		},
		{
			symbol: "XLM",
			address: "CDLZFA7IYMV2DKV2VEBZLZ6XVJDV6HJT4EHZM6LOJH6TQL6YN6MQIWCD",
			name: "Stellar Lumens",
		}
	];

    const validateForm = (): boolean => {
		const newErrors: Partial<VestingForm> = {};

		if (!form.beneficiary) {
			newErrors.beneficiary = "Required";
		} else if (!StrKey.isValidEd25519PublicKey(form.beneficiary)) {
			newErrors.beneficiary = "Invalid Address";
		}

		if (!form.token) newErrors.token = "Required";

		if (!form.totalAmount) {
			newErrors.totalAmount = "Required";
		} else if (parseFloat(form.totalAmount) <= 0) {
			newErrors.totalAmount = "Must be > 0";
		}

		if (!form.startDate) newErrors.startDate = "Required";
		if (!form.cliffMonths) newErrors.cliffMonths = "Required";
		if (!form.vestingMonths) newErrors.vestingMonths = "Required";

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        try {
            const startDateTime = new Date(`${form.startDate}T${form.startTime}`)
            const startTimeUnix = Math.floor(startDateTime.getTime() / 1000)
            const cliffSeconds = parseInt(form.cliffMonths) * 30 * 24 * 3600
            const totalSeconds = parseInt(form.vestingMonths) * 30 * 24 * 3600

            await createSchedule(
                form.beneficiary,
                form.token,
                form.totalAmount,
                startTimeUnix,
                cliffSeconds,
                totalSeconds,
                form.revocable
            )

            onSuccess?.()
            setForm(DEFAULT_FORM)
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to create schedule"
            onError?.(errorMessage)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <User size={12} className="text-gray-400" />
                            Beneficiary Address
                        </label>
                        <input
                            type="text"
                            value={form.beneficiary}
                            onChange={(e) => setForm(prev => ({ ...prev, beneficiary: e.target.value.toUpperCase() }))}
                            placeholder="G..."
                            className={cn(
                                "w-full bg-gray-900/50 border rounded-2xl px-4 py-3 text-sm focus:border-purple-500 transition-all outline-none font-mono",
                                errors.beneficiary ? "border-red-500/50" : "border-gray-800"
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Coins size={12} className="text-gray-400" />
                                Token
                            </label>
                            <select
                                value={form.token}
                                onChange={(e) => setForm(prev => ({ ...prev, token: e.target.value }))}
                                className={cn(
                                    "w-full bg-gray-900/50 border rounded-2xl px-4 py-3 text-sm focus:border-purple-500 transition-all outline-none appearance-none",
                                    errors.token ? "border-red-500/50" : "border-gray-800"
                                )}
                            >
                                <option value="">Asset</option>
                                {availableTokens.map((t) => (
                                    <option key={t.address} value={t.address}>{t.symbol}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <DollarSign size={12} className="text-gray-400" />
                                Amount
                            </label>
                            <input
                                type="number"
                                value={form.totalAmount}
                                onChange={(e) => setForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                                placeholder="0.00"
                                className={cn(
                                    "w-full bg-gray-900/50 border rounded-2xl px-4 py-3 text-sm focus:border-purple-500 transition-all outline-none font-bold",
                                    errors.totalAmount ? "border-red-500/50" : "border-gray-800"
                                )}
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black uppercase tracking-widest text-purple-400 flex items-center gap-2">
                                <Shield size={12} />
                                Revocable by Admin
                            </label>
                            <button 
                                type="button"
                                onClick={() => setForm(prev => ({ ...prev, revocable: !prev.revocable }))}
                                className={cn(
                                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                    form.revocable ? "bg-purple-600" : "bg-gray-800"
                                )}
                            >
                                <span className={cn(
                                    "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                    form.revocable ? "translate-x-4" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                        <p className="text-[9px] text-gray-500 font-medium leading-relaxed">If enabled, the grantor can revoke the schedule and reclaim unvested tokens at any time.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Calendar size={12} />
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={form.startDate}
                                onChange={(e) => setForm(prev => ({ ...prev, startDate: e.target.value }))}
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Clock size={12} />
                                Time
                            </label>
                            <input
                                type="time"
                                value={form.startTime}
                                onChange={(e) => setForm(prev => ({ ...prev, startTime: e.target.value }))}
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <Timer size={12} />
                                Cliff (Months)
                            </label>
                            <input
                                type="number"
                                value={form.cliffMonths}
                                onChange={(e) => setForm(prev => ({ ...prev, cliffMonths: e.target.value }))}
                                placeholder="e.g. 6"
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                                <TrendingUp size={12} />
                                Vesting (Months)
                            </label>
                            <input
                                type="number"
                                value={form.vestingMonths}
                                onChange={(e) => setForm(prev => ({ ...prev, vestingMonths: e.target.value }))}
                                placeholder="e.g. 24"
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl px-3 py-2.5 text-xs text-white outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div className="bg-gray-950/50 border border-gray-800 p-4 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Allocation Preview</span>
                            <Badge variant="secondary" className="text-[8px] py-0 h-4">System Calculated</Badge>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-gray-600">Initial Cliff</span>
                                <span className="text-white">0.00 {form.token && availableTokens.find(t => t.address === form.token)?.symbol}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-gray-600">Release Rate</span>
                                <span className="text-white">Linear</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Button 
                type="submit" 
                className="w-full rounded-2xl h-14 font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-purple-900/20 bg-purple-600 hover:bg-purple-500"
                disabled={isLoading}
            >
                {isLoading ? (
                    <div className="flex items-center gap-2">
					    <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                        Initializing Setup...
                    </div>
				) : (
					<div className="flex items-center gap-2">
						Initialize Vesting Schedule
						<ShieldCheck size={16} />
					</div>
				)}
            </Button>
        </form>
    )
}

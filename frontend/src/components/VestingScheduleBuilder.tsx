"use client"

import React, { useState } from 'react'
import { CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'

const LABEL_OPTIONS = ['Team', 'Advisor', 'Seed', 'Investor', 'Custom']
const TOKEN_OPTIONS = ['XLM', 'USDC', 'yXLM']

interface VestingForm {
    beneficiary: string
    token: string
    totalAmount: string
    startDate: string
    cliffMonths: string
    vestingMonths: string
    label: string
    customLabel: string
}

const DEFAULT_FORM: VestingForm = {
    beneficiary: '',
    token: 'XLM',
    totalAmount: '',
    startDate: '',
    cliffMonths: '',
    vestingMonths: '',
    label: 'Team',
    customLabel: '',
}

function formatDate(d: string) {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function addMonths(dateStr: string, months: number) {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    d.setMonth(d.getMonth() + months)
    return formatDate(d.toISOString().split('T')[0])
}

type Status = 'idle' | 'submitting' | 'success'

export function VestingScheduleBuilder() {
    const [form, setForm] = useState<VestingForm>(DEFAULT_FORM)
    const [preview, setPreview] = useState(false)
    const [status, setStatus] = useState<Status>('idle')

    const set = (field: keyof VestingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [field]: e.target.value }))

    const cliffEnd = addMonths(form.startDate, Number(form.cliffMonths) || 0)
    const vestEnd = addMonths(form.startDate, (Number(form.cliffMonths) || 0) + (Number(form.vestingMonths) || 0))
    const effectiveLabel = form.label === 'Custom' ? form.customLabel || 'Custom' : form.label

    const isValid =
        form.beneficiary.length >= 10 &&
        Number(form.totalAmount) > 0 &&
        form.startDate &&
        Number(form.cliffMonths) >= 0 &&
        Number(form.vestingMonths) > 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid) return
        setStatus('submitting')
        await new Promise((r) => setTimeout(r, 1600))
        setStatus('success')
        setTimeout(() => {
            setForm(DEFAULT_FORM)
            setPreview(false)
            setStatus('idle')
        }, 3500)
    }

    if (status === 'success') {
        return (
            <div className="flex flex-col items-center gap-5 py-16 bg-stellar-surface border border-stellar-border rounded-xl">
                <div className="relative">
                    <CheckCircle2 className="h-16 w-16 text-green-400" />
                    <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping" />
                </div>
                <p className="text-white text-xl font-bold">Vesting Schedule Created!</p>
                <p className="text-gray-400 text-sm text-center max-w-xs">
                    <span className="text-stellar-secondary font-semibold">{form.totalAmount} {form.token}</span> will vest to{' '}
                    <span className="font-mono text-gray-300">{form.beneficiary.slice(0, 8)}…</span> with label{' '}
                    <span className="text-stellar-primary">{effectiveLabel}</span>.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            <form onSubmit={handleSubmit} className="bg-stellar-surface border border-stellar-border rounded-xl p-6 flex flex-col gap-5">

                {/* Beneficiary */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Beneficiary Address</label>
                    <input
                        value={form.beneficiary}
                        onChange={set('beneficiary')}
                        placeholder="G... Stellar address"
                        className="w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder-gray-600 focus:outline-none focus:border-stellar-primary transition-colors"
                    />
                </div>

                {/* Token + Amount */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Token</label>
                        <select
                            value={form.token}
                            onChange={set('token')}
                            className="w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-stellar-primary transition-colors"
                        >
                            {TOKEN_OPTIONS.map((t) => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Total Amount</label>
                        <input
                            type="number"
                            min="0"
                            value={form.totalAmount}
                            onChange={set('totalAmount')}
                            placeholder="e.g. 10000"
                            className="w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-stellar-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Start Date */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Start Date</label>
                    <input
                        type="date"
                        value={form.startDate}
                        onChange={set('startDate')}
                        className="w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-stellar-primary transition-colors"
                    />
                </div>

                {/* Cliff + Vesting Duration */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Cliff Duration (months)</label>
                        <input
                            type="number"
                            min="0"
                            value={form.cliffMonths}
                            onChange={set('cliffMonths')}
                            placeholder="e.g. 6"
                            className="w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-stellar-primary transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Vesting Duration (months)</label>
                        <input
                            type="number"
                            min="1"
                            value={form.vestingMonths}
                            onChange={set('vestingMonths')}
                            placeholder="e.g. 24"
                            className="w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-stellar-primary transition-colors"
                        />
                    </div>
                </div>

                {/* Label */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Label</label>
                    <div className="flex flex-wrap gap-2">
                        {LABEL_OPTIONS.map((l) => (
                            <button
                                type="button"
                                key={l}
                                onClick={() => setForm((f) => ({ ...f, label: l }))}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${form.label === l
                                        ? 'border-stellar-primary bg-stellar-primary/20 text-white'
                                        : 'border-stellar-border text-gray-400 hover:border-stellar-primary/50'
                                    }`}
                            >
                                {l}
                            </button>
                        ))}
                    </div>
                    {form.label === 'Custom' && (
                        <input
                            value={form.customLabel}
                            onChange={set('customLabel')}
                            placeholder="Enter custom label"
                            className="mt-3 w-full bg-[#0D1117] border border-stellar-border rounded-lg px-4 py-2.5 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-stellar-primary transition-colors"
                        />
                    )}
                </div>

                {/* Preview Toggle */}
                <button
                    type="button"
                    onClick={() => setPreview((p) => !p)}
                    className="flex items-center gap-2 text-stellar-secondary text-sm hover:underline w-fit"
                >
                    {preview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {preview ? 'Hide Preview' : 'Show Preview'}
                </button>

                {/* Preview Panel */}
                {preview && (
                    <div className="bg-[#0D1117] border border-stellar-border/60 rounded-xl p-5 grid grid-cols-2 gap-3 text-sm">
                        {[
                            ['Beneficiary', form.beneficiary ? `${form.beneficiary.slice(0, 12)}…` : '—'],
                            ['Token', form.token],
                            ['Total Amount', form.totalAmount ? `${form.totalAmount} ${form.token}` : '—'],
                            ['Label', effectiveLabel],
                            ['Start Date', formatDate(form.startDate)],
                            ['Cliff End', cliffEnd],
                            ['Fully Vested', vestEnd],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <p className="text-gray-500 text-xs uppercase tracking-wide">{k}</p>
                                <p className="text-white font-medium mt-0.5">{v}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    disabled={!isValid || status === 'submitting'}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg bg-stellar-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {status === 'submitting' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Creating Schedule…</>
                    ) : (
                        'Create Vesting Schedule'
                    )}
                </button>
            </form>
        </div>
    )
}

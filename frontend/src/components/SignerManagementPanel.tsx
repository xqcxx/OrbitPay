'use client'

import { useState } from 'react'
import { useTreasury, Signer } from '@/hooks/useTreasury'
import { Plus, Trash2, ShieldCheck, UserPlus, Save, AlertCircle } from 'lucide-react'

export default function SignerManagementPanel() {
    const { signers, threshold, addSigner, removeSigner, updateThreshold, isLoading } = useTreasury()
    const [newSignerAddress, setNewSignerAddress] = useState('')
    const [newThreshold, setNewThreshold] = useState<number>(threshold || 0)
    const [error, setError] = useState<string | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Sync newThreshold when threshold loads
    if (newThreshold === 0 && threshold !== 0) {
        setNewThreshold(threshold)
    }

    const handleAddSigner = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!newSignerAddress.trim()) {
            setError('Address is required')
            return
        }

        if (signers.some(s => s.address === newSignerAddress)) {
            setError('Signer already exists')
            return
        }

        try {
            await addSigner(newSignerAddress, 1)
            setNewSignerAddress('')
        } catch (err: any) {
            setError(err?.message || 'Failed to add signer')
        }
    }

    const handleUpdateThreshold = async () => {
        setError(null)
        if (newThreshold <= 0) {
            setError('Threshold must be greater than 0')
            return
        }
        if (newThreshold > signers.length) {
            setError('Threshold cannot exceed the number of signers')
            return
        }

        setIsSaving(true)
        try {
            await updateThreshold(newThreshold)
        } catch (err: any) {
            setError(err?.message || 'Failed to update threshold')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-800/40 rounded-lg w-1/4" />
                <div className="h-64 bg-gray-800/40 rounded-2xl w-full" />
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-400" />
                    Signer Management
                </h2>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-400 text-sm">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Signer List and Add Form */}
                <div className="space-y-6">
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-700/50 bg-gray-900/20 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Current Signers</h3>
                            <span className="text-xs bg-gray-700/50 text-gray-300 px-2 py-0.5 rounded-full">{signers.length}</span>
                        </div>
                        <div className="divide-y divide-gray-700/50">
                            {signers.map((signer) => (
                                <div key={signer.address} className="px-6 py-4 flex items-center justify-between hover:bg-gray-700/20 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-mono text-white truncate max-w-[200px] md:max-w-xs" title={signer.address}>
                                            {signer.address}
                                        </span>
                                        <span className="text-xs text-gray-500">Weight: {signer.weight}</span>
                                    </div>
                                    <button
                                        onClick={() => removeSigner(signer.address)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                                        title="Remove Signer"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {signers.length === 0 && (
                                <div className="px-6 py-8 text-center text-gray-500 text-sm italic">
                                    No signers configured for this treasury.
                                </div>
                            )}
                        </div>
                    </div>

                    <form onSubmit={handleAddSigner} className="flex gap-2">
                        <div className="relative flex-1">
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Stellar Address (G...)"
                                value={newSignerAddress}
                                onChange={(e) => setNewSignerAddress(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-700/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                        >
                            <Plus className="w-4 h-4" />
                            Add Signer
                        </button>
                    </form>
                </div>

                {/* Right Column: Threshold Settings */}
                <div className="space-y-6">
                    <div className="bg-gray-800/40 border border-gray-700/50 rounded-2xl p-6 space-y-6">
                        <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Approval Threshold</h3>

                        <div className="space-y-4">
                            <p className="text-sm text-gray-400 leading-relaxed">
                                The threshold determines the minimum number of weighted signatures required to execute a withdrawal from this treasury.
                            </p>

                            <div className="flex items-center gap-4">
                                <input
                                    type="number"
                                    min="1"
                                    max={signers.length}
                                    value={newThreshold}
                                    onChange={(e) => setNewThreshold(parseInt(e.target.value))}
                                    className="w-24 bg-gray-900/50 border border-gray-700/50 rounded-xl px-4 py-2 text-lg font-bold text-center focus:border-blue-500/50 outline-none transition-all"
                                />
                                <span className="text-gray-500 font-medium">of {signers.length} signers required</span>
                            </div>

                            <div className="pt-2">
                                <button
                                    onClick={handleUpdateThreshold}
                                    disabled={isSaving || newThreshold === threshold}
                                    className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                                >
                                    {isSaving ? (
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    Save Threshold
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6">
                        <h4 className="text-sm font-medium text-blue-400 mb-2">Security Tip</h4>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            We recommend a threshold of <span className="text-blue-400 font-medium">N/2 + 1</span> (where N is the number of signers) for optimal security and reliability.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

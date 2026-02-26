'use client'

import { useState } from 'react'
import { useTreasury } from '@/hooks/useTreasury'
import { Plus, Trash2, ShieldCheck, UserPlus, Save, AlertCircle, Users, BadgeCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Badge } from "@/components/ui/Badge"
import { Skeleton } from "@/components/ui/Skeleton"
import { cn } from "@/lib/utils"

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

    if (isLoading && signers.length === 0) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-64 w-full rounded-3xl" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <Card className="border-blue-500/10 bg-blue-500/[0.02]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5 text-blue-400" />
                                Access Control
                            </CardTitle>
                            <CardDescription>Manage authorized signers and quorum.</CardDescription>
                        </div>
                        <Badge variant="success" className="gap-1 px-3 py-1">
                            <BadgeCheck className="w-3 h-3" />
                            Active
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-bold animate-in zoom-in-95">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Authorized Signers</span>
                            <span className="text-[10px] bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-bold">{signers.length}</span>
                        </div>
                        <div className="grid gap-2">
                            {signers.map((signer) => (
                                <div key={signer.address} className="flex items-center justify-between p-3 bg-gray-900/50 border border-gray-800 rounded-2xl group hover:border-blue-500/30 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                                            {signer.address.slice(0, 1)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-mono text-white" title={signer.address}>
                                                {signer.address.slice(0, 12)}...{signer.address.slice(-6)}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Weight: {signer.weight}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSigner(signer.address)}
                                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <form onSubmit={handleAddSigner} className="flex gap-2">
                        <div className="relative flex-1">
                            <UserPlus className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                            <input
                                type="text"
                                placeholder="Stellar Address (G...)"
                                value={newSignerAddress}
                                onChange={(e) => setNewSignerAddress(e.target.value)}
                                className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <Button type="submit" size="sm" className="rounded-2xl h-10 px-4">
                            <Plus className="w-4 h-4" />
                        </Button>
                    </form>

                    <div className="pt-4 border-t border-gray-800 space-y-4">
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Quorum Setting</span>
                            <Users className="w-3.5 h-3.5 text-gray-600" />
                        </div>
                        <div className="flex items-center gap-4 bg-gray-900/40 p-4 rounded-2xl border border-gray-800">
                            <input
                                type="number"
                                min="1"
                                max={signers.length}
                                value={newThreshold}
                                onChange={(e) => setNewThreshold(parseInt(e.target.value))}
                                className="w-16 bg-gray-800 border border-gray-700 rounded-xl px-2 py-2 text-xl font-black text-center text-blue-400 outline-none focus:border-blue-500 transition-all"
                            />
                            <div className="flex-1">
                                <p className="text-xs text-white font-bold">Required Signatures</p>
                                <p className="text-[10px] text-gray-500 font-medium">Out of {signers.length} total signers.</p>
                            </div>
                        </div>
                        <Button
                            className="w-full rounded-2xl font-bold uppercase tracking-widest text-[11px]"
                            onClick={handleUpdateThreshold}
                            disabled={isSaving || newThreshold === threshold}
                        >
                            {isSaving ? 'Updating...' : 'Save Settings'}
                            <Save className="w-3.5 h-3.5 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

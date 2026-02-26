'use client'

import React, { useState, useEffect } from 'react'
import { useVesting, VestingSchedule } from '@/hooks/useVesting'
import { Wallet, CheckCircle2, AlertCircle, ArrowUpRight, TrendingUp, Lock, Unlock } from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/Modal"

interface ClaimModalProps {
    schedule: VestingSchedule
}

export default function ClaimModal({ schedule }: ClaimModalProps) {
    const { claimFromSchedule, getProgress, isLoading } = useVesting()
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [claimable, setClaimable] = useState<number>(0)

    useEffect(() => {
        if (isOpen) {
            const fetchProgress = async () => {
                const progress = await getProgress(schedule.id)
                if (progress) {
                    setClaimable(Number(progress.claimable_amount) / 10_000_000)
                }
            }
            fetchProgress()
        }
    }, [isOpen, schedule.id, getProgress])

    const handleClaim = async () => {
        setError(null)
        try {
            await claimFromSchedule(schedule.id)
            setSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setSuccess(false)
            }, 3000)
        } catch (err: any) {
            setError(err?.message || 'Failed to claim tokens')
        }
    }

    return (
        <Modal open={isOpen} onOpenChange={setIsOpen}>
            <ModalTrigger asChild>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    className="flex-1 rounded-xl h-10 font-bold uppercase tracking-widest text-[10px] gap-2"
                    disabled={schedule.revoked}
                >
                    <Wallet size={14} />
                    View & Claim
                </Button>
            </ModalTrigger>
            <ModalContent>
                <ModalHeader>
                    <ModalTitle>Withdraw Vested Tokens</ModalTitle>
                    <ModalDescription>Releasing assets from Schedule #{schedule.id.slice(0, 8)}</ModalDescription>
                </ModalHeader>

                <div className="py-8 text-center space-y-4">
                    {success ? (
                        <div className="animate-in zoom-in duration-300 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Claim Successful!</h3>
                                <p className="text-sm text-gray-500 font-medium">Your vested tokens have been released.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Available to Withdraw</span>
                                <div className="text-5xl font-black text-white font-mono tracking-tighter italic">
                                    {claimable.toFixed(4)}
                                </div>
                                <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{schedule.token.slice(0, 10)}...</span>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-bold text-left">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-3 text-left">
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1">
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Total Allocation</p>
                                    <p className="text-sm font-bold text-white italic">{parseFloat(schedule.totalAmount).toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-1">
                                    <p className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Already Claimed</p>
                                    <p className="text-sm font-bold text-gray-400 italic">{parseFloat(schedule.claimedAmount).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!success && (
                    <ModalFooter className="gap-2">
                        <Button variant="ghost" className="rounded-2xl flex-1 h-12" onClick={() => setIsOpen(false)}>Close</Button>
                        <Button 
                            className="rounded-2xl flex-1 h-12 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-purple-900/20 bg-purple-600 hover:bg-purple-500"
                            onClick={handleClaim}
                            disabled={isLoading || claimable <= 0}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                            ) : (
                                <>
                                    Confirm Release
                                    <ArrowUpRight size={14} />
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                )}
            </ModalContent>
        </Modal>
    )
}

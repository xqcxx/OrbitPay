'use client'

import React, { useState } from 'react'
import { useVesting } from '@/hooks/useVesting'
import { ShieldAlert, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/Modal"

interface AdminRevokePanelProps {
    scheduleId: string
}

export default function AdminRevokePanel({ scheduleId }: AdminRevokePanelProps) {
    const { revokeSchedule, isLoading } = useVesting()
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleRevoke = async () => {
        setError(null)
        try {
            await revokeSchedule(scheduleId)
            setSuccess(true)
            setTimeout(() => {
                setIsOpen(false)
                setSuccess(false)
            }, 3000)
        } catch (err: any) {
            setError(err?.message || 'Failed to revoke schedule')
        }
    }

    return (
        <Modal open={isOpen} onOpenChange={setIsOpen}>
            <ModalTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-10 w-10 p-0 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl"
                >
                    <ShieldAlert size={16} />
                </Button>
            </ModalTrigger>
            <ModalContent>
                <ModalHeader>
                    <ModalTitle className="text-red-500 flex items-center gap-2">
                        <ShieldAlert size={20} />
                        Revoke Vesting Schedule
                    </ModalTitle>
                    <ModalDescription>Irreversible administrative action for Schedule #{scheduleId.slice(0, 8)}</ModalDescription>
                </ModalHeader>

                <div className="py-8 space-y-6">
                    {success ? (
                        <div className="animate-in zoom-in duration-300 flex flex-col items-center gap-4 text-center">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Schedule Revoked</h3>
                                <p className="text-sm text-gray-500 font-medium">Unvested tokens have been returned to grantor.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl space-y-3">
                                <div className="flex items-center gap-3 text-red-500 font-black uppercase tracking-widest text-xs">
                                    <AlertTriangle size={16} />
                                    Critical Warning
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed font-medium">
                                    Revoking this schedule will immediately stop all token vesting. 
                                    Any tokens already vested but not yet claimed by the beneficiary will remain claimable, while all unvested tokens will be returned to your account.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-red-400 text-xs font-bold">
                                    <AlertTriangle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    <span>Target Schedule</span>
                                    <span className="text-gray-400 font-mono tracking-normal">#{scheduleId}</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-600">
                                    <span>Action Impact</span>
                                    <span className="text-red-400">Irreversible Lockout</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!success && (
                    <ModalFooter className="gap-2">
                        <Button variant="ghost" className="rounded-2xl flex-1 h-12" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button 
                            variant="destructive"
                            className="rounded-2xl flex-1 h-12 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-red-900/20"
                            onClick={handleRevoke}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                            ) : (
                                <>
                                    Confirm Revocation
                                    <ShieldAlert size={14} />
                                </>
                            )}
                        </Button>
                    </ModalFooter>
                )}
            </ModalContent>
        </Modal>
    )
}

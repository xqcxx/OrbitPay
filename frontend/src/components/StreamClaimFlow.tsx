'use client'

import React, { useState } from 'react'
import { usePayrollStream, Stream } from '@/hooks/usePayrollStream'
import { Wallet, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react'
import { Button } from "@/components/ui/Button"
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/Modal"

interface StreamClaimFlowProps {
    stream: Stream
    claimableAmount: string
}

export default function StreamClaimFlow({ stream, claimableAmount }: StreamClaimFlowProps) {
    const { claimFromStream, isLoading } = usePayrollStream()
    const [isOpen, setIsOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const handleClaim = async () => {
        setError(null)
        try {
            await claimFromStream(stream.id)
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
                    disabled={parseFloat(claimableAmount) <= 0}
                >
                    <Wallet size={14} />
                    Claim
                </Button>
            </ModalTrigger>
            <ModalContent>
                <ModalHeader>
                    <ModalTitle>Claim Tokens</ModalTitle>
                    <ModalDescription>Withdraw your accrued earnings to your wallet.</ModalDescription>
                </ModalHeader>

                <div className="py-8 text-center space-y-4">
                    {success ? (
                        <div className="animate-in zoom-in duration-300 flex flex-col items-center gap-4">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20">
                                <CheckCircle2 className="w-10 h-10 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-xl font-bold text-white">Claim Successful!</h3>
                                <p className="text-sm text-gray-500 font-medium">Tokens have been sent to your wallet.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Available to Claim</span>
                                <div className="text-5xl font-black text-white font-mono tracking-tighter italic">
                                    {parseFloat(claimableAmount).toFixed(6)}
                                </div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{stream.token.slice(0, 10)}...</span>
                            </div>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 text-red-400 text-xs font-bold text-left">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3 text-left">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <span>Stream ID</span>
                                    <span className="text-gray-300 font-mono tracking-normal">{stream.id.slice(0, 12)}...</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-500">
                                    <span>Network Fee</span>
                                    <span className="text-green-400">~0.0001 XLM</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {!success && (
                    <ModalFooter className="gap-2">
                        <Button variant="ghost" className="rounded-2xl flex-1 h-12" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button 
                            className="rounded-2xl flex-1 h-12 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-blue-900/20"
                            onClick={handleClaim}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white border-t-white/30 rounded-full animate-spin" />
                            ) : (
                                <>
                                    Confirm Claim
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

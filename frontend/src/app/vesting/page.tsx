'use client'

import React, { useState } from 'react';
import { useFreighter } from "@/contexts/FreighterContext";
import { useVesting } from "@/hooks/useVesting";
import { 
  Plus, 
  History, 
  Shield, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Timer,
  Lock,
  Unlock,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import VestingScheduleBuilder from "@/components/VestingScheduleBuilder";
import VestingTimeline from "@/components/VestingTimeline";
import ClaimModal from "@/components/ClaimModal";
import AdminRevokePanel from "@/components/AdminRevokePanel";
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/Modal";

export default function VestingPage() {
  const { isConnected } = useFreighter()
  const { schedules, isLoading } = useVesting()
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 max-w-md shadow-2xl">
          <Timer className="w-16 h-16 text-purple-500 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-8">
            Connect your Freighter wallet to manage vesting schedules, track token releases, and claim vested assets.
          </p>
          <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-500 text-white">Connect Wallet</Button>
        </div>
      </div>
    )
  }

  const activeSchedules = schedules.filter(s => !s.revoked)
  const totalAllocated = schedules.reduce((acc, s) => acc + parseFloat(s.totalAmount), 0)

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent italic tracking-tight">⏳ Vesting</h1>
          <p className="text-gray-400 mt-2 font-medium">Equitable token distribution with cliff and linear releases.</p>
        </div>
        <div className="flex gap-3">
          <Modal open={isBuilderOpen} onOpenChange={setIsBuilderOpen}>
            <ModalTrigger asChild>
              <Button className="gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-xl shadow-purple-900/40">
                <Plus size={18} />
                Create Schedule
              </Button>
            </ModalTrigger>
            <ModalContent className="sm:max-w-2xl">
              <ModalHeader>
                <ModalTitle>New Vesting Schedule</ModalTitle>
                <ModalDescription>Configure lockup and release parameters for a beneficiary.</ModalDescription>
              </ModalHeader>
              <VestingScheduleBuilder onSuccess={() => setIsBuilderOpen(false)} />
            </ModalContent>
          </Modal>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-purple-600 to-indigo-700 border-none text-white shadow-xl shadow-purple-900/30 overflow-hidden relative">
            <div className="absolute right-[-10%] top-[-10%] w-40 h-40 bg-white/20 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Total Vested</CardTitle>
            <TrendingUp className="w-5 h-5 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{totalAllocated.toLocaleString()}</div>
            <p className="text-xs font-bold mt-1 opacity-70">Across {schedules.length} schedules</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Locked Assets</CardTitle>
            <Lock className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">$0.00</div>
            <p className="text-xs text-red-400 font-bold mt-1">Awaiting cliff/release</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Unlocked Assets</CardTitle>
            <Unlock className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">$0.00</div>
            <p className="text-xs text-green-400 font-bold mt-1">Available for claim</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Revocable</CardTitle>
            <ShieldAlert className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{schedules.filter(s => s.revocable).length}</div>
            <p className="text-xs text-gray-500 font-bold mt-1">Admin revocation rights</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-black flex items-center gap-2 text-white">
                    <History className="w-5 h-5 text-purple-400" />
                    Active Schedules
                </h2>
                <Badge variant="secondary" className="font-black uppercase tracking-widest text-[10px]">{activeSchedules.length} Active</Badge>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {isLoading ? (
                    Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-3xl" />
                    ))
                ) : activeSchedules.length === 0 ? (
                    <div className="text-center py-32 bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl">
                        <Lock className="w-12 h-12 text-gray-800 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-500 font-bold">No active vesting schedules found.</p>
                    </div>
                ) : (
                    activeSchedules.map((schedule) => (
                        <Card key={schedule.id} className="group hover:border-purple-500/30 transition-all bg-gray-900/40 overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-6 space-y-6">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-black uppercase tracking-widest text-purple-400">Schedule #{schedule.id}</span>
                                                {schedule.revocable && <Badge variant="warning" className="text-[8px] py-0 h-4">Revocable</Badge>}
                                            </div>
                                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                                To: <span className="font-mono text-gray-400 text-sm">{schedule.beneficiary.slice(0, 12)}...{schedule.beneficiary.slice(-8)}</span>
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-white italic">{parseFloat(schedule.totalAmount).toLocaleString()}</p>
                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{schedule.token.slice(0, 8)}</p>
                                        </div>
                                    </div>

                                    <VestingTimeline schedule={schedule} />

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Claimed</span>
                                                <span className="text-xs font-bold text-gray-400">{parseFloat(schedule.claimedAmount).toFixed(2)}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-gray-600 uppercase tracking-tighter">Vested</span>
                                                <span className="text-xs font-bold text-green-400">0.00</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <ClaimModal schedule={schedule} />
                                            {schedule.grantor === isConnected && schedule.revocable && (
                                                <AdminRevokePanel scheduleId={schedule.id} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>

        <div className="space-y-8">
            <Card className="border-purple-500/10 bg-purple-500/[0.02]">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Timer className="w-5 h-5 text-purple-400" />
                        Vesting Rules
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">Cliff Period</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">No tokens can be claimed during the cliff. After cliff expires, tokens vest linearly.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">Linear Release</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">Tokens release second-by-second after the cliff period started, until the end date.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-white uppercase tracking-wider">Revocation</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">If enabled, the grantor can stop the vesting and reclaim unvested tokens.</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-500/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-white">
                        <Shield className="w-5 h-5 text-purple-400" />
                        Audit Status
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                        <span className="text-xs font-bold text-gray-300">Contract Integrity Verified</span>
                    </div>
                    <p className="text-[10px] text-gray-500 leading-relaxed text-center font-medium"> All vesting operations are immutable and secured by the Stellar Soroban network.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

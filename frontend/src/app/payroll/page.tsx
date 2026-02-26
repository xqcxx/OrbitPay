'use client'

import React, { useState } from 'react';
import { useFreighter } from "@/contexts/FreighterContext";
import { usePayrollStream } from "@/hooks/usePayrollStream";
import { 
  Plus, 
  Send, 
  Receipt, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Zap,
  ArrowRightLeft,
  LayoutGrid,
  List as ListIcon
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import StreamCreationForm from "@/components/StreamCreationForm";
import ActiveStreamsList from "@/components/ActiveStreamsList";
import PayrollAnalytics from "@/components/PayrollAnalytics";
import { Modal, ModalContent, ModalDescription, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/Modal";

export default function PayrollPage() {
  const { isConnected } = useFreighter()
  const { streams, isLoading } = usePayrollStream()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 max-w-md shadow-2xl">
          <Zap className="w-16 h-16 text-blue-500 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-8">
            Connect your Freighter wallet to manage payment streams, claim tokens, and view payroll analytics.
          </p>
          <Button size="lg" className="w-full">Connect Wallet</Button>
        </div>
      </div>
    )
  }

  const activeStreams = streams.filter(s => s.status === 'Active')
  const completedStreams = streams.filter(s => s.status === 'Completed')

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent italic tracking-tight">💸 Payroll</h1>
          <p className="text-gray-400 mt-2 font-medium">Continuous payment streaming for modern organizations.</p>
        </div>
        <div className="flex gap-3">
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-1 flex gap-1">
                <Button 
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setViewMode('grid')}
                >
                    <LayoutGrid size={16} />
                </Button>
                <Button 
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
                    size="sm" 
                    className="h-8 px-2"
                    onClick={() => setViewMode('list')}
                >
                    <ListIcon size={16} />
                </Button>
            </div>
          
          <Modal open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <ModalTrigger asChild>
              <Button className="gap-2 shadow-lg shadow-blue-900/40">
                <Plus size={18} />
                Create Stream
              </Button>
            </ModalTrigger>
            <ModalContent className="sm:max-w-xl">
              <ModalHeader>
                <ModalTitle>New Payment Stream</ModalTitle>
                <ModalDescription>Setup a continuous token flow to a recipient.</ModalDescription>
              </ModalHeader>
              <StreamCreationForm onSuccess={() => setIsCreateOpen(false)} />
            </ModalContent>
          </Modal>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-blue-600 border-none text-white shadow-xl shadow-blue-900/20 overflow-hidden relative">
            <div className="absolute right-[-20px] top-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] opacity-80">Active Streams</CardTitle>
            <Zap className="w-5 h-5 text-white/50" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black">{activeStreams.length}</div>
            <p className="text-xs font-bold mt-1 opacity-70">Running continuously</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Total Streamed</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">$0.00</div>
            <p className="text-xs text-green-400 font-bold mt-1">Live updates enabled</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Upcoming Costs</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">$0.00</div>
            <p className="text-xs text-gray-500 font-bold mt-1">Next 30 days projection</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-400">Completed</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{completedStreams.length}</div>
            <p className="text-xs text-gray-500 font-bold mt-1">Historical payrolls</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
            <Card className="border-none bg-gray-900/40">
                <CardHeader className="px-0 pt-0">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                            Stream Management
                        </CardTitle>
                        <Badge variant="secondary" className="font-black uppercase tracking-widest text-[10px]">Total: {streams.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="px-0">
                    <ActiveStreamsList view={viewMode} />
                </CardContent>
            </Card>
        </div>

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                        Payroll Distribution
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <PayrollAnalytics />
                </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-900/20 to-blue-900/20 border-indigo-500/20">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-indigo-400" />
                        Streaming FAQ
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">How do I claim?</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">Recipients can claim accrued tokens at any time proportional to the streaming rate.</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-white uppercase tracking-wider">Who can cancel?</p>
                        <p className="text-[11px] text-gray-400 leading-relaxed">Only the sender can cancel a stream. Unstreamed tokens are returned to the sender.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}

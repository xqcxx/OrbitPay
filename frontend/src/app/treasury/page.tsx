'use client'

import React, { useState } from 'react';
import { useFreighter } from "@/contexts/FreighterContext";
import { useTreasury } from "@/hooks/useTreasury";
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Users, 
  Shield, 
  FileText, 
  DollarSign, 
  Clock,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import TransactionHistory from "@/components/TransactionHistory";
import SignerManagementPanel from "@/components/SignerManagementPanel";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from "@/components/ui/Modal";

export default function TreasuryPage() {
  const { isConnected } = useFreighter()
  const { 
    signers, 
    threshold, 
    proposals, 
    isLoading, 
    deposit, 
    createWithdrawal, 
    approveWithdrawal 
  } = useTreasury()

  const [isDepositOpen, setIsDepositOpen] = useState(false)
  const [isWithdrawalOpen, setIsWithdrawalOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [token, setToken] = useState('')
  const [recipient, setRecipient] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDeposit = async () => {
    setIsSubmitting(true)
    try {
      await deposit(token, amount)
      setIsDepositOpen(false)
      setAmount('')
      setToken('')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreateWithdrawal = async () => {
    setIsSubmitting(true)
    try {
      await createWithdrawal(token, recipient, amount)
      setIsWithdrawalOpen(false)
      setAmount('')
      setToken('')
      setRecipient('')
    } catch (error) {
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 max-w-md shadow-2xl">
          <Shield className="w-16 h-16 text-blue-500 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Wallet</h2>
          <p className="text-gray-400 mb-8">
            Connect your Freighter wallet to manage treasury operations, signers, and proposals.
          </p>
          <Button size="lg" className="w-full">Connect Wallet</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">🏦 Treasury</h1>
          <p className="text-gray-400 mt-2 font-medium">Multi-sig vault management and automated reporting.</p>
        </div>
        <div className="flex gap-3">
          <Modal open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <ModalTrigger asChild>
              <Button variant="outline" className="gap-2">
                <ArrowDownLeft size={18} />
                Deposit
              </Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Deposit Assets</ModalTitle>
                <ModalDescription>Send tokens to the treasury vault.</ModalDescription>
              </ModalHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Token Address</label>
                  <input 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="G..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Amount</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setIsDepositOpen(false)}>Cancel</Button>
                <Button onClick={handleDeposit} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Confirm Deposit'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>

          <Modal open={isWithdrawalOpen} onOpenChange={setIsWithdrawalOpen}>
            <ModalTrigger asChild>
              <Button className="gap-2">
                <ArrowUpRight size={18} />
                New Proposal
              </Button>
            </ModalTrigger>
            <ModalContent>
              <ModalHeader>
                <ModalTitle>Create Withdrawal Proposal</ModalTitle>
                <ModalDescription>Proposals require quorum approval to execute.</ModalDescription>
              </ModalHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Recipient Address</label>
                  <input 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="G..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Token Address</label>
                  <input 
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="G..."
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-gray-500">Amount</label>
                  <input 
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setIsWithdrawalOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateWithdrawal} disabled={isSubmitting}>
                  {isSubmitting ? 'Proposing...' : 'Create Proposal'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">TVL</CardTitle>
            <DollarSign className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">$0.00</div>
            <p className="text-xs text-green-400 font-bold mt-1">+0.0% from last month</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">Signers</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{signers.length}</div>
            <p className="text-xs text-gray-500 font-bold mt-1">Quorum: {threshold}/{signers.length}</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">Pending</CardTitle>
            <Clock className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{proposals.filter(p => !p.executed).length}</div>
            <p className="text-xs text-gray-500 font-bold mt-1">Requires your attention</p>
          </CardContent>
        </Card>
        <Card className="hover:scale-[1.02] transition-transform">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-bold text-gray-400 uppercase tracking-wider">Executed</CardTitle>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-white">{proposals.filter(p => p.executed).length}</div>
            <p className="text-xs text-gray-500 font-bold mt-1">Total transactions</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader className="border-b border-gray-800">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  Active Proposals
                </CardTitle>
                <Badge variant="secondary">{proposals.filter(p => !p.executed).length} Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-800">
                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-6 space-y-3">
                      <Skeleton className="h-6 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  ))
                ) : proposals.filter(p => !p.executed).length === 0 ? (
                  <div className="p-12 text-center text-gray-500 italic">No pending proposals found.</div>
                ) : (
                  proposals.filter(p => !p.executed).map((proposal) => (
                    <div key={proposal.id} className="p-6 hover:bg-white/[0.02] transition-colors flex justify-between items-center group">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-lg">Proposal #{proposal.id}</span>
                          <Badge variant="outline" className="text-[10px]">{proposal.executed ? 'Executed' : 'Pending'}</Badge>
                        </div>
                        <p className="text-sm text-gray-400 font-medium">
                          Sending <span className="text-blue-400 font-bold">{proposal.amount}</span> tokens to <span className="text-gray-300 font-mono text-xs">{proposal.recipient.substring(0, 8)}...</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex -space-x-2">
                            {proposal.approvals.map((addr, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-blue-600 border-2 border-gray-900 flex items-center justify-center text-[10px] font-bold" title={addr}>
                                {i + 1}
                              </div>
                            ))}
                            {Array.from({ length: Math.max(0, threshold - proposal.approvals.length) }).map((_, i) => (
                              <div key={i} className="w-6 h-6 rounded-full bg-gray-800 border-2 border-gray-900 flex items-center justify-center text-[10px]" />
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">{proposal.approvals.length}/{threshold} Approvals</span>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => approveWithdrawal(proposal.id)}
                        disabled={isLoading}
                      >
                        Approve
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>History</CardTitle>
              <CardDescription>Recent governance activities and events.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionHistory />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Area */}
        <div className="space-y-8 text-white">
          <SignerManagementPanel />
          
          <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-400" />
                Security Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Quorum</span>
                <span className="font-bold">{threshold} of {signers.length} signatures</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Timelock</span>
                <span className="font-bold">None</span>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed bg-black/20 p-3 rounded-xl">
                This treasury is protected by a multi-sig configuration. Proposals must reach the approval threshold before they can be executed.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

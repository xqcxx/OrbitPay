'use client'

import TransactionHistory from "@/components/TransactionHistory";
import { useFreighter } from "@/contexts/FreighterContext";
import DepositModal from "@/components/DepositModal";
import WithdrawalRequestForm from "@/components/WithdrawalRequestForm";
import WithdrawalRequestList from "@/components/WithdrawalRequestList";
import { useTreasury } from "@/hooks/useTreasury";
import { Plus, Send, Wallet, Shield, Activity } from "lucide-react";
import { useState } from "react";

export default function TreasuryPage() {
	const { publicKey, isConnected } = useFreighter();
	const { proposals, threshold, signers, balances, isLoading } = useTreasury();
	const [showDepositModal, setShowDepositModal] = useState(false);
	const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const isAdmin = isConnected && publicKey !== null;
  const pendingCount = proposals.filter((p: any) => p.status === 'Pending').length;
  
  // Calculate total balance in XLM (STARS)
  const xlmBalance = balances['CDLZFC3SYJYDZW7KZN6H7MXTRJLWUQQ3TA3TLX5RLWOZ7TN6DOKYC4GY'] || BigInt(0);
  const formattedBalance = (Number(xlmBalance) / 1e7).toFixed(2);

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">🏦 Treasury</h1>
          <p className="text-gray-400 max-w-lg">
            Multi-signature vault management with configurable approval thresholds and automated withdrawal workflows.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDepositModal(true)}
            className="bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold py-3 px-6 rounded-2xl flex items-center gap-2 transition-all backdrop-blur-md"
          >
            <Plus size={20} className="text-green-400" />
            Deposit
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-2xl flex items-center gap-2 shadow-lg shadow-purple-900/20 transition-all"
          >
            <Send size={20} />
            New Withdrawal
          </button>
        </div>
      </div>

      {/* Treasury Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Wallet size={64} />
          </div>
          <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Available Assets</div>
          <div className="text-3xl font-black text-white">0.00 <span className="text-sm font-normal text-gray-500">STARS</span></div>
          <div className="mt-4 flex items-center gap-2 text-xs text-green-400 font-medium">
            <Activity size={12} />
            Live contract balance
          </div>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Send size={64} />
          </div>
          <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Pending Proposals</div>
          <div className="text-3xl font-black text-white">{pendingCount}</div>
          <div className="mt-4 flex items-center gap-2 text-xs text-blue-400 font-medium">
            <Activity size={12} />
            Awaiting multi-sig approval
          </div>
        </div>

        <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <Shield size={64} />
          </div>
          <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Configuration</div>
          <div className="text-3xl font-black text-white">{threshold} <span className="text-sm font-normal text-gray-500">/ {signers.length}</span></div>
          <div className="mt-4 flex items-center gap-2 text-xs text-purple-400 font-medium">
            <Activity size={12} />
            Approval threshold
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Withdrawal Proposals</h2>
            </div>
            <WithdrawalRequestList />
          </section>

          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Ledger Activity</h2>
            </div>
            <TransactionHistory />
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 p-8 rounded-3xl backdrop-blur-xl">
            <h3 className="text-xl font-black text-white mb-6">Security Policy</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>
                <p className="text-sm text-gray-400">All withdrawals require <span className="text-white font-bold">{threshold} of {signers.length}</span> signatures.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-sm text-gray-400">Proposers automatically approve their own requests on creation.</p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                </div>
                <p className="text-sm text-gray-400">Once the threshold is met, anyone can trigger the final execution.</p>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      <DepositModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={(amount, token) => {
          console.log(`Deposited ${amount} ${token}`);
          setShowDepositModal(false);
        }}
      />

      <WithdrawalRequestForm
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onSuccess={(id, hash) => {
          console.log(`Created proposal ${id} in tx ${hash}`);
          setShowWithdrawalModal(false);
        }}
      />
    </div>
  );
}

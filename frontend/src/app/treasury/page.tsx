'use client'

import TransactionHistory from "@/components/TransactionHistory";
import { useFreighter } from "@/contexts/FreighterContext";
import DepositModal from "@/components/DepositModal";
import WithdrawalRequestForm from "@/components/WithdrawalRequestForm";
import WithdrawalRequestList from "@/components/WithdrawalRequestList";
import { useTreasury } from "@/hooks/useTreasury";
import {
  Plus, Send, Wallet, Shield, Activity, Users, Copy,
  CheckCircle, Clock, ArrowUpRight, ArrowDownLeft, Loader2,
  Key, Hash, TrendingUp,
} from "lucide-react";
import { useState, useMemo } from "react";

const KNOWN_TOKENS: Record<string, { symbol: string; decimals: number }> = {
  'CDLZFC3SYJYDZW7KZN6H7MXTRJLWUQQ3TA3TLX5RLWOZ7TN6DOKYC4GY': { symbol: 'XLM', decimals: 7 },
  'CCJZ3LU7PC7UUDLR7HHGL7VP3A7X4TS7YPXXPWUPZO33SRFHIJ2BHC3L': { symbol: 'USDC', decimals: 7 },
};

function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function formatTokenBalance(raw: bigint, decimals: number): string {
  const num = Number(raw) / Math.pow(10, decimals);
  return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-gray-500 hover:text-white transition-colors" title="Copy address">
      {copied ? <CheckCircle size={14} className="text-green-400" /> : <Copy size={14} />}
    </button>
  );
}

export default function TreasuryPage() {
  const { publicKey, isConnected } = useFreighter();
  const { admin, proposals, threshold, signers, balances, isLoading, transactionHistory } = useTreasury();
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);

  const pendingCount = proposals.filter((p) => p.status === 'Pending').length;
  const approvedCount = proposals.filter((p) => p.status === 'Approved').length;
  const executedCount = proposals.filter((p) => p.status === 'Executed').length;
  const totalProposals = proposals.length;

  const recentProposals = useMemo(() => proposals.slice(0, 5), [proposals]);
  const recentEvents = useMemo(() => transactionHistory.events.slice(0, 8), [transactionHistory]);

  return (
    <div className="max-w-7xl mx-auto p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            Treasury Overview
          </h1>
          <p className="text-gray-400 max-w-lg">
            Multi-signature vault status, balances, and recent activity at a glance.
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-purple-400" size={32} />
          <span className="ml-3 text-gray-400">Loading treasury data...</span>
        </div>
      )}

      {/* Token Balances */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-300 uppercase tracking-widest mb-4">Vault Balances</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(KNOWN_TOKENS).map(([address, token]) => {
            const raw = balances[address] || BigInt(0);
            const formatted = formatTokenBalance(raw, token.decimals);
            return (
              <div key={address} className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Wallet size={56} />
                </div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">{token.symbol}</div>
                <div className="text-3xl font-black text-white">
                  {formatted}
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                  <span className="font-mono">{truncateAddress(address, 8)}</span>
                  <CopyButton text={address} />
                </div>
              </div>
            );
          })}

          {/* Total Proposals Card */}
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Hash size={56} />
            </div>
            <div className="text-sm text-gray-400 font-bold uppercase tracking-widest mb-1">Total Proposals</div>
            <div className="text-3xl font-black text-white">{totalProposals}</div>
            <div className="mt-3 flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-yellow-400">
                <Clock size={12} /> {pendingCount} pending
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <CheckCircle size={12} /> {executedCount} executed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Admin & Signers + Threshold */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-gray-300 uppercase tracking-widest mb-4">Vault Configuration</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Admin Card */}
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                <Key size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Admin</div>
              </div>
            </div>
            {admin ? (
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm text-white bg-gray-900/60 px-3 py-2 rounded-xl border border-gray-700/50 truncate flex-1">
                  {truncateAddress(admin, 8)}
                </span>
                <CopyButton text={admin} />
              </div>
            ) : (
              <div className="text-sm text-gray-500 italic">Not configured</div>
            )}
          </div>

          {/* Threshold Card */}
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Shield size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Approval Threshold</div>
              </div>
            </div>
            <div className="text-3xl font-black text-white">
              {threshold} <span className="text-lg font-normal text-gray-500">of {signers.length}</span>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              signatures required to execute withdrawals
            </div>
          </div>

          {/* Signer Count Card */}
          <div className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-3xl backdrop-blur-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <div>
                <div className="text-sm text-gray-400 font-bold uppercase tracking-widest">Authorized Signers</div>
              </div>
            </div>
            <div className="text-3xl font-black text-white">{signers.length}</div>
            <div className="mt-2 text-xs text-gray-500">
              addresses with voting power
            </div>
          </div>
        </div>
      </section>

      {/* Signer List */}
      {signers.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-300 uppercase tracking-widest mb-4">Signer Addresses</h2>
          <div className="bg-gray-800/40 border border-gray-700/50 rounded-3xl backdrop-blur-xl overflow-hidden">
            <div className="divide-y divide-gray-700/40">
              {signers.map((signer, i) => (
                <div key={signer} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center text-xs font-bold text-purple-300">
                      {i + 1}
                    </div>
                    <span className="font-mono text-sm text-gray-300">{truncateAddress(signer, 10)}</span>
                    {signer === admin && (
                      <span className="text-xs bg-purple-500/10 border border-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                        Admin
                      </span>
                    )}
                    {isConnected && signer === publicKey && (
                      <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-300 px-2 py-0.5 rounded-full font-bold">
                        You
                      </span>
                    )}
                  </div>
                  <CopyButton text={signer} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content: Proposals + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Recent Proposals */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Withdrawal Proposals</h2>
              {totalProposals > 0 && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 text-yellow-400 font-bold">
                    <Clock size={14} /> {pendingCount} Pending
                  </span>
                  <span className="flex items-center gap-1 text-blue-400 font-bold">
                    <CheckCircle size={14} /> {approvedCount} Approved
                  </span>
                  <span className="flex items-center gap-1 text-green-400 font-bold">
                    <ArrowUpRight size={14} /> {executedCount} Executed
                  </span>
                </div>
              )}
            </div>
            <WithdrawalRequestList />
          </section>

          {/* Ledger Activity */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Ledger Activity</h2>
            </div>
            <TransactionHistory />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Security Policy */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 p-8 rounded-3xl backdrop-blur-xl">
            <h3 className="text-xl font-black text-white mb-6">Security Policy</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                </div>
                <p className="text-sm text-gray-400">
                  All withdrawals require <span className="text-white font-bold">{threshold} of {signers.length}</span> signatures.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                </div>
                <p className="text-sm text-gray-400">
                  Proposers automatically approve their own requests on creation.
                </p>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                </div>
                <p className="text-sm text-gray-400">
                  Once the threshold is met, anyone can trigger the final execution.
                </p>
              </li>
            </ul>
          </div>

          {/* Quick Stats */}
          <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 border border-gray-700/50 p-8 rounded-3xl backdrop-blur-xl">
            <h3 className="text-xl font-black text-white mb-6">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Signers</span>
                <span className="text-sm font-bold text-white">{signers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Threshold</span>
                <span className="text-sm font-bold text-white">{threshold}/{signers.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Total Proposals</span>
                <span className="text-sm font-bold text-white">{totalProposals}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Pending</span>
                <span className="text-sm font-bold text-yellow-400">{pendingCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Executed</span>
                <span className="text-sm font-bold text-green-400">{executedCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Ledger Events</span>
                <span className="text-sm font-bold text-white">{transactionHistory.total}</span>
              </div>
            </div>
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

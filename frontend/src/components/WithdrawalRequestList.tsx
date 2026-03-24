'use client'

import React, { useState } from 'react';
import { Loader2, CheckCircle, Play, Clock, User, ArrowRight, Shield, AlertTriangle } from 'lucide-react';
import { useFreighter } from '@/contexts/FreighterContext';
import { useTreasury, WithdrawalRequest } from '@/hooks/useTreasury';
import { NETWORK, getSorobanServer, getExplorerUrl } from '@/lib/network';
import { signTransaction } from '@/lib/wallet';
import { TransactionBuilder } from '@stellar/stellar-sdk';

export default function WithdrawalRequestList() {
  const { isConnected, publicKey } = useFreighter();
  const { proposals, threshold, signers, isLoading, approveWithdrawal, executeWithdrawal, fetchProposals } = useTreasury();
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleApprove = async (proposalId: number) => {
    if (!isConnected || !publicKey) return;
    setProcessingId(proposalId);
    try {
      const txXdr = await approveWithdrawal(proposalId);
      const signedXdr = await signTransaction(txXdr, NETWORK.networkPassphrase);
      const server = getSorobanServer();
      const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);
      const result = await server.sendTransaction(transaction);
      
      // Poll
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await server.getTransaction(result.hash);
        if (status.status === 'SUCCESS') {
          await fetchProposals();
          break;
        }
      }
    } catch (error) {
      console.error('Approval failed:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecute = async (proposalId: number) => {
    if (!isConnected || !publicKey) return;
    setProcessingId(proposalId);
    try {
      const txXdr = await executeWithdrawal(proposalId);
      const signedXdr = await signTransaction(txXdr, NETWORK.networkPassphrase);
      const server = getSorobanServer();
      const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);
      const result = await server.sendTransaction(transaction);
      
      // Poll
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await server.getTransaction(result.hash);
        if (status.status === 'SUCCESS') {
          await fetchProposals();
          break;
        }
      }
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (isLoading && proposals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <Loader2 className="animate-spin mb-4" size={32} />
        <p>Loading withdrawal requests...</p>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-gray-800/20 border border-gray-700/50 rounded-2xl p-12 text-center text-gray-500">
        <Clock className="mx-auto mb-4 opacity-20" size={48} />
        <p className="text-lg font-medium">No withdrawal requests found</p>
        <p className="text-sm">Initiate a request to see it listed here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2 px-2">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="text-blue-400" size={20} /> Pending Approvals
          <span className="bg-blue-900/40 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">
            {proposals.filter(p => p.status === 'Pending').length}
          </span>
        </h3>
        <div className="text-xs text-gray-500 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          Threshold: {threshold} of {signers.length} signers
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {proposals.map((proposal) => {
          const isPending = proposal.status === 'Pending';
          const isApproved = proposal.status === 'Approved';
          const isExecuted = proposal.status === 'Executed';
          const hasVoted = publicKey && proposal.approvals.includes(publicKey);
          const canExecute = isApproved;
          const approvalCount = proposal.approvals.length;
          const progressPercent = Math.min((approvalCount / threshold) * 100, 100);

          return (
            <div key={proposal.id} className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl hover:border-gray-600 transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                        {proposal.id}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-white font-bold text-lg">{proposal.memo}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider ${
                            isExecuted ? 'bg-green-900/20 border-green-500/50 text-green-400' :
                            isApproved ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' :
                            'bg-yellow-900/20 border-yellow-500/50 text-yellow-400'
                          }`}>
                            {proposal.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">Created: {new Date(proposal.createdAt * 1000).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-mono font-bold text-white">{(Number(proposal.amount) / 1e7).toFixed(2)}</p>
                      <p className="text-xs text-gray-500 font-medium">STARS</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                      <User className="text-gray-500" size={16} />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Recipient</p>
                        <p className="text-white font-mono text-xs">{formatAddress(proposal.recipient)}</p>
                      </div>
                    </div>
                    <div className="bg-gray-900/40 p-3 rounded-xl border border-gray-800 flex items-center gap-3">
                      <Shield className="text-gray-500" size={16} />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Proposer</p>
                        <p className="text-white font-mono text-xs">{formatAddress(proposal.proposer)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">Approval Progress</span>
                      <span className="text-white font-bold">{approvalCount} / {threshold}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                      <div 
                        className={`h-full transition-all duration-500 ${isApproved || isExecuted ? 'bg-green-500' : 'bg-blue-500'}`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col gap-3 min-w-[140px]">
                  {isPending && !hasVoted && (
                    <button
                      onClick={() => handleApprove(proposal.id)}
                      disabled={!!processingId}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
                    >
                      {processingId === proposal.id ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle size={18} />}
                      Approve
                    </button>
                  )}
                  {isPending && hasVoted && (
                    <div className="flex-1 bg-gray-800 text-blue-400 border border-blue-500/20 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-default">
                      <CheckCircle size={18} />
                      Approved
                    </div>
                  )}
                  {canExecute && (
                    <button
                      onClick={() => handleExecute(proposal.id)}
                      disabled={!!processingId}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
                    >
                      {processingId === proposal.id ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                      Execute
                    </button>
                  )}
                  {isExecuted && (
                    <div className="flex-1 bg-green-900/10 text-green-500 border border-green-500/20 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-default">
                      <CheckCircle size={18} />
                      Finalized
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

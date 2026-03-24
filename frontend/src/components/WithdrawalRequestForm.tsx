'use client'

import React, { useState } from 'react';
import { X, Loader2, AlertCircle, Fuel, Send } from 'lucide-react';
import { useFreighter } from '@/contexts/FreighterContext';
import { useTreasury } from '@/hooks/useTreasury';
import { NETWORK, getSorobanServer, getExplorerUrl } from '@/lib/network';
import { signTransaction } from '@/lib/wallet';
import { TransactionBuilder } from '@stellar/stellar-sdk';

const TOKENS = [
  { symbol: 'XLM', name: 'Stellar Lumens', address: 'CDLZFC3SYJYDZW7KZN6H7MXTRJLWUQQ3TA3TLX5RLWOZ7TN6DOKYC4GY', decimals: 7 },
  { symbol: 'USDC', name: 'USD Coin', address: 'CCJZ3LU7PC7UUDLR7HHGL7VP3A7X4TS7YPXXPWUPZO33SRFHIJ2BHC3L', decimals: 7 },
];

interface WithdrawalRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (proposalId: number, txHash: string) => void;
}

export default function WithdrawalRequestForm({ isOpen, onClose, onSuccess }: WithdrawalRequestFormProps) {
  const { isConnected, publicKey } = useFreighter();
  const { createWithdrawal, fetchProposals } = useTreasury();
  
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    if (!recipient || !amount) {
      setError('Recipient and amount are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const decimals = selectedToken.decimals;
      const amountScaled = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));
      
      const txXdr = await createWithdrawal(
        selectedToken.address,
        recipient,
        amountScaled.toString(),
        memo || 'withdrawal'
      );

      const signedXdr = await signTransaction(txXdr, NETWORK.networkPassphrase);
      const server = getSorobanServer();
      const transaction = TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase);
      
      const result = await server.sendTransaction(transaction);
      if (result.status === 'ERROR') {
        throw new Error('Transaction failed');
      }

      // Poll for result
      let confirmed = false;
      let txResult = null;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await server.getTransaction(result.hash);
        if (status.status === 'SUCCESS') {
          confirmed = true;
          txResult = status;
          break;
        } else if (status.status === 'FAILED') {
          throw new Error('Transaction failed in ledger');
        }
      }

      if (confirmed && txResult) {
        // In a real app we'd parse the proposal ID from events or return value
        // For now let's just refresh the list
        await fetchProposals();
        onSuccess(0, result.hash);
        onClose();
      } else {
        throw new Error('Transaction confirmation timed out');
      }
    } catch (err: any) {
      console.error('Withdrawal request failed:', err);
      setError(err.message || 'Failed to create withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Send className="text-purple-400" size={24} /> New Withdrawal Request
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Select Token</label>
            <select
              value={selectedToken.address}
              onChange={(e) => setSelectedToken(TOKENS.find(t => t.address === e.target.value) || TOKENS[0])}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
            >
              {TOKENS.map(t => (
                <option key={t.address} value={t.address}>{t.symbol} - {t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Recipient Address</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="G..."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white text-lg font-medium placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                {selectedToken.symbol}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Memo (optional)</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Salary, Rent, etc."
              maxLength={32}
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isConnected}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isConnected && recipient && amount
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Creating Proposal...
              </>
            ) : (
              'Create Withdrawal Request'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

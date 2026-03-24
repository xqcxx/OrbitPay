'use client'

import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, ChevronDown, Fuel } from 'lucide-react';
import { useFreighter } from '@/contexts/FreighterContext';
import { getSorobanServer, CONTRACTS, NETWORK, addressToScVal, i128ToScVal, getExplorerUrl } from '@/lib/network';
import { signTransaction } from '@/lib/wallet';
import { Contract, TransactionBuilder, nativeToScVal, xdr } from '@stellar/stellar-sdk';

const TOKENS = [
  { symbol: 'XLM', name: 'Stellar Lumens', address: 'CDLZFC3SYJYDZW7KZN6H7MXTRJLWUQQ3TA3TLX5RLWOZ7TN6DOKYC4GY', decimals: 7 },
  { symbol: 'USDC', name: 'USD Coin', address: 'CCJZ3LU7PC7UUDLR7HHGL7VP3A7X4TS7YPXXPWUPZO33SRFHIJ2BHC3L', decimals: 7 },
];

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: string, token: string, txHash: string) => void;
}

export default function DepositModal({ isOpen, onClose, onSuccess }: DepositModalProps) {
  const { publicKey, isConnected } = useFreighter();
  const [selectedToken, setSelectedToken] = useState(TOKENS[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTokenDropdown, setShowTokenDropdown] = useState(false);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      estimateGasFee();
    } else {
      setEstimatedFee(null);
    }
  }, [amount, selectedToken]);

  async function estimateGasFee() {
    if (!publicKey) return;
    setEstimating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setEstimatedFee('0.01 XLM');
    } catch (err) {
      console.error('Fee estimation failed:', err);
    } finally {
      setEstimating(false);
    }
  }

  function validateAmount(value: string): string | null {
    if (!value || value === '') return 'Amount is required';
    const num = parseFloat(value);
    if (isNaN(num)) return 'Invalid amount';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > 1000000) return 'Amount exceeds maximum limit';
    return null;
  }

  async function handleDeposit() {
    if (!isConnected || !publicKey) {
      setError('Please connect your wallet');
      return;
    }

    const validationError = validateAmount(amount);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!CONTRACTS.treasury) {
      setError('Treasury contract not deployed');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const server = getSorobanServer();
      const config = NETWORK;

      const decimals = selectedToken.decimals;
      const amountBigInt = BigInt(Math.floor(parseFloat(amount) * Math.pow(10, decimals)));

      const contract = new Contract(CONTRACTS.treasury);
      const call = contract.call(
        'deposit',
        addressToScVal(publicKey),
        addressToScVal(selectedToken.address),
        i128ToScVal(amountBigInt)
      );

      const account = await server.getAccount(publicKey);
      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: config.networkPassphrase,
      })
        .addOperation(call)
        .setTimeout(30)
        .build();

      const simulated = await server.simulateTransaction(transaction);
      if ('error' in simulated && simulated.error) {
        throw new Error(`Simulation failed: ${simulated.error}`);
      }

      const txXdr = transaction.toXDR();
      const signedXdr = await signTransaction(txXdr, config.networkPassphrase);

      const signedTx = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
      const result = await server.sendTransaction(signedTx);

      if (result.status === 'ERROR') {
        throw new Error('Transaction submission failed');
      }

      let finalHash = result.hash;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const status = await server.getTransaction(result.hash);
        if (status.status === 'SUCCESS') {
          finalHash = result.hash;
          break;
        }
        if (status.status === 'FAILED') {
          throw new Error('Transaction failed');
        }
      }

      onSuccess(amount, selectedToken.symbol, finalHash);
      onClose();
    } catch (err: any) {
      console.error('Deposit failed:', err);
      setError(err.message || 'Failed to deposit tokens');
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-green-400">💰</span> Deposit to Treasury
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm text-gray-400 font-medium">Select Token</label>
            <div className="relative">
              <button
                onClick={() => setShowTokenDropdown(!showTokenDropdown)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center justify-between hover:border-gray-600 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {selectedToken.symbol[0]}
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">{selectedToken.symbol}</p>
                    <p className="text-xs text-gray-500">{selectedToken.name}</p>
                  </div>
                </div>
                <ChevronDown className="text-gray-400" size={20} />
              </button>
              {showTokenDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-xl z-10">
                  {TOKENS.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        setSelectedToken(token);
                        setShowTokenDropdown(false);
                      }}
                      className="w-full p-4 flex items-center gap-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {token.symbol[0]}
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{token.symbol}</p>
                        <p className="text-xs text-gray-500">{token.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
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

          <div className="bg-gray-800/50 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400 flex items-center gap-2">
                <Fuel size={16} /> Estimated Gas Fee
              </span>
              {estimating ? (
                <Loader2 className="animate-spin text-gray-500" size={16} />
              ) : estimatedFee ? (
                <span className="text-white font-medium">{estimatedFee}</span>
              ) : (
                <span className="text-gray-600">-</span>
              )}
            </div>
          </div>

          <button
            onClick={handleDeposit}
            disabled={loading || !isConnected || !amount || parseFloat(amount) <= 0}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              isConnected && amount && parseFloat(amount) > 0
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-900/20'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Processing...
              </>
            ) : !isConnected ? (
              'Connect Wallet to Deposit'
            ) : (
              `Deposit ${amount || '0'} ${selectedToken.symbol}`
            )}
          </button>

          <p className="text-center text-xs text-gray-500">
            Deposit will execute a transaction on Stellar network
          </p>
        </div>
      </div>
    </div>
  );
}

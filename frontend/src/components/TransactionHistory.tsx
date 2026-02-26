'use client';

import { useState } from 'react';
import { Calendar, Filter, ArrowUpDown, ArrowUp, ArrowDown, Clock, User, DollarSign, Users, Settings } from 'lucide-react';
import { useTreasury, TreasuryEvent } from '@/hooks/useTreasury';

interface TransactionHistoryProps {
  className?: string;
}

const EVENT_TYPE_LABELS = {
  deposit: 'Deposit',
  withdrawal_created: 'Withdrawal Created',
  withdrawal_approved: 'Withdrawal Approved',
  withdrawal_executed: 'Withdrawal Executed',
  signer_added: 'Signer Added',
  signer_removed: 'Signer Removed',
  threshold_updated: 'Threshold Updated',
  initialized: 'Treasury Initialized',
};

const EVENT_TYPE_ICONS = {
  deposit: DollarSign,
  withdrawal_created: ArrowUp,
  withdrawal_approved: Users,
  withdrawal_executed: ArrowDown,
  signer_added: User,
  signer_removed: User,
  threshold_updated: Settings,
  initialized: Settings,
};

const EVENT_TYPE_COLORS = {
  deposit: 'text-green-400',
  withdrawal_created: 'text-yellow-400',
  withdrawal_approved: 'text-blue-400',
  withdrawal_executed: 'text-red-400',
  signer_added: 'text-purple-400',
  signer_removed: 'text-orange-400',
  threshold_updated: 'text-cyan-400',
  initialized: 'text-gray-400',
};

export default function TransactionHistory({ className = '' }: TransactionHistoryProps) {
  const { transactionHistory, loadTransactionHistory, isLoading } = useTreasury();
  const [filterType, setFilterType] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleFilterChange = (eventType: string) => {
    setFilterType(eventType);
    setCurrentPage(1);
    loadTransactionHistory(itemsPerPage, undefined, eventType || undefined);
  };

  const handleSortChange = () => {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    // Sort the current events
    const sortedEvents = [...transactionHistory.events].sort((a, b) => {
      return newOrder === 'desc'
        ? b.timestamp - a.timestamp
        : a.timestamp - b.timestamp;
    });
    // Note: In a real implementation, you'd want to sort on the server side
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatAmount = (amount?: string) => {
    if (!amount) return '';
    // Convert from stroops to display format (assuming 7 decimal places)
    const numAmount = parseInt(amount) / 10000000;
    return numAmount.toFixed(7);
  };

  const renderEventDetails = (event: TreasuryEvent) => {
    switch (event.type) {
      case 'deposit':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">From:</span> {formatAddress(event.details.recipient || '')}
            <br />
            <span className="font-medium">Amount:</span> {formatAmount(event.details.amount)} tokens
          </div>
        );
      case 'withdrawal_created':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">Proposal ID:</span> {event.details.proposalId}
            <br />
            <span className="font-medium">Proposer:</span> {formatAddress(event.details.proposer || '')}
          </div>
        );
      case 'withdrawal_approved':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">Proposal ID:</span> {event.details.proposalId}
            <br />
            <span className="font-medium">Approved by:</span> {formatAddress(event.details.signer || '')}
          </div>
        );
      case 'withdrawal_executed':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">To:</span> {formatAddress(event.details.recipient || '')}
            <br />
            <span className="font-medium">Amount:</span> {formatAmount(event.details.amount)} tokens
          </div>
        );
      case 'signer_added':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">New signer:</span> {formatAddress(event.details.signer || '')}
          </div>
        );
      case 'signer_removed':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">Removed signer:</span> {formatAddress(event.details.signer || '')}
          </div>
        );
      case 'threshold_updated':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">New threshold:</span> {event.details.threshold} signers
          </div>
        );
      case 'initialized':
        return (
          <div className="text-sm text-gray-300">
            <span className="font-medium">Admin:</span> {formatAddress(event.details.admin || '')}
          </div>
        );
      default:
        return null;
    }
  };

  const paginatedEvents = transactionHistory.events.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(transactionHistory.events.length / itemsPerPage);

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-700 ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Transaction History
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Events</option>
                <option value="deposit">Deposits</option>
                <option value="w_create">Withdrawal Created</option>
                <option value="approve">Withdrawal Approved</option>
                <option value="w_exec">Withdrawal Executed</option>
                <option value="s_add">Signer Added</option>
                <option value="s_remove">Signer Removed</option>
                <option value="t_upd">Threshold Updated</option>
                <option value="init">Initialized</option>
              </select>
            </div>
            <button
              onClick={handleSortChange}
              className="flex items-center gap-1 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-sm text-white transition-colors"
            >
              <ArrowUpDown className="w-4 h-4" />
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-400">Loading transactions...</span>
          </div>
        ) : transactionHistory.events.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No transactions found
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {paginatedEvents.map((event) => {
                const IconComponent = EVENT_TYPE_ICONS[event.type];
                const colorClass = EVENT_TYPE_COLORS[event.type];

                return (
                  <div
                    key={event.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg bg-gray-700 ${colorClass}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white">
                            {EVENT_TYPE_LABELS[event.type]}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Calendar className="w-4 h-4" />
                            {formatTimestamp(event.timestamp)}
                          </div>
                        </div>
                        {renderEventDetails(event)}
                        <div className="mt-2 text-xs text-gray-500">
                          Ledger: {event.ledger} • TX: {event.id.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed border border-gray-600 rounded text-sm text-white transition-colors"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-400">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:bg-gray-700 disabled:cursor-not-allowed border border-gray-600 rounded text-sm text-white transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
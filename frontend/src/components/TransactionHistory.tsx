'use client';

import { useState } from 'react';
import { Calendar, Filter, ArrowUpDown, ArrowUp, ArrowDown, Clock, User, DollarSign, Users, Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTreasury, TreasuryEvent } from '@/hooks/useTreasury';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

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

const EVENT_TYPE_VARIANTS = {
  deposit: 'success',
  withdrawal_created: 'warning',
  withdrawal_approved: 'default',
  withdrawal_executed: 'destructive',
  signer_added: 'secondary',
  signer_removed: 'warning',
  threshold_updated: 'secondary',
  initialized: 'outline',
} as const;

export default function TransactionHistory({ className = '' }: TransactionHistoryProps) {
  const { transactionHistory, loadTransactionHistory, isLoading } = useTreasury();
  const [filterType, setFilterType] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleFilterChange = (eventType: string) => {
    setFilterType(eventType);
    setCurrentPage(1);
    loadTransactionHistory(itemsPerPage, undefined, eventType || undefined);
  };

  const handleSortChange = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
  };

  const renderEventDetails = (event: TreasuryEvent) => {
    switch (event.type) {
      case 'deposit':
        return (
          <p className="text-sm text-gray-400">
            Deposited <span className="text-white font-bold">{event.details.amount}</span> tokens from <span className="font-mono text-xs">{formatAddress(event.details.recipient || '')}</span>
          </p>
        );
      case 'withdrawal_created':
        return (
          <p className="text-sm text-gray-400">
            Proposal <span className="text-white font-bold">#{event.details.proposalId}</span> created by <span className="font-mono text-xs">{formatAddress(event.details.proposer || '')}</span>
          </p>
        );
      case 'withdrawal_approved':
        return (
          <p className="text-sm text-gray-400">
            Proposal <span className="text-white font-bold">#{event.details.proposalId}</span> approved by <span className="font-mono text-xs">{formatAddress(event.details.signer || '')}</span>
          </p>
        );
      case 'withdrawal_executed':
        return (
          <p className="text-sm text-gray-400">
            Sent <span className="text-white font-bold">{event.details.amount}</span> tokens to <span className="font-mono text-xs">{formatAddress(event.details.recipient || '')}</span>
          </p>
        );
      case 'signer_added':
        return (
          <p className="text-sm text-gray-400">
            Added <span className="font-mono text-xs">{formatAddress(event.details.signer || '')}</span> as a new signer
          </p>
        );
      case 'threshold_updated':
        return (
          <p className="text-sm text-gray-400">
            Approval threshold updated to <span className="text-white font-bold">{event.details.threshold}</span>
          </p>
        );
      default:
        return null;
    }
  };

  const sortedEvents = [...transactionHistory.events].sort((a, b) => {
    return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
  });

  const paginatedEvents = sortedEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(transactionHistory.events.length / itemsPerPage);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-1.5 transition-all focus-within:border-blue-500">
                <Filter className="w-3.5 h-3.5 text-gray-500" />
                <select
                    value={filterType}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="bg-transparent border-none text-xs text-white outline-none cursor-pointer"
                >
                    <option value="">All Events</option>
                    <option value="deposit">Deposits</option>
                    <option value="w_create">Proposals</option>
                    <option value="approve">Approvals</option>
                    <option value="w_exec">Executions</option>
                    <option value="s_add">Signers</option>
                    <option value="t_upd">Threshold</option>
                </select>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSortChange} 
              className="h-8 text-[11px] font-bold uppercase tracking-wider gap-2 border-gray-800"
            >
              <ArrowUpDown className="w-3 h-3" />
              {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
            </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))
        ) : transactionHistory.events.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/30 border border-dashed border-gray-800 rounded-3xl">
            <Clock className="w-10 h-10 text-gray-700 mx-auto mb-3 opacity-20" />
            <p className="text-gray-500 font-medium">No activity recorded yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {paginatedEvents.map((event) => {
                const IconComponent = EVENT_TYPE_ICONS[event.type] || Clock;
                return (
                  <div
                    key={event.id}
                    className="group bg-gray-900/50 hover:bg-gray-800/50 rounded-2xl p-4 border border-gray-800 transition-all flex items-start gap-4"
                  >
                    <div className={cn(
                        "p-2.5 rounded-xl border",
                        event.type === 'deposit' ? "bg-green-500/10 border-green-500/20 text-green-400" :
                        event.type === 'withdrawal_executed' ? "bg-red-500/10 border-red-500/20 text-red-400" :
                        "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    )}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{EVENT_TYPE_LABELS[event.type]}</span>
                            <Badge variant={EVENT_TYPE_VARIANTS[event.type]} className="py-0 h-4 text-[9px] uppercase tracking-tighter">
                                {event.timestamp < (Date.now() / 1000 - 86400) ? 'History' : 'Recent'}
                            </Badge>
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-600" />
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>
                      {renderEventDetails(event)}
                      <div className="flex items-center gap-3 pt-1">
                        <span className="text-[10px] text-gray-600 font-mono">#{event.id.slice(0, 12)}</span>
                        <div className="h-1 w-1 rounded-full bg-gray-800" />
                        <span className="text-[10px] text-gray-600 uppercase font-black tracking-widest leading-none">Ledger {event.ledger}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 border-gray-800"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 border-gray-800"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
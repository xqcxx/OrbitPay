'use client';

import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ArrowUpDown, 
  Clock, 
  Shield, 
  Zap, 
  Wallet,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useReports, ActivityEvent, ActivityModule } from '@/hooks/useReports';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

const MODULE_CONFIG = {
  treasury: {
    label: 'Treasury',
    icon: Shield,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  payroll: {
    label: 'Payroll',
    icon: Zap,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  vesting: {
    label: 'Vesting',
    icon: Clock,
    color: 'text-indigo-400',
    bg: 'bg-indigo-500/10',
    border: 'border-indigo-500/20',
  }
};

export default function FilterableActivityLog() {
  const { events, isLoading, exportToCSV } = useReports();
  const [search, setSearch] = useState('');
  const [moduleFilter, setModuleFilter] = useState<ActivityModule | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.type.toLowerCase().includes(search.toLowerCase()) ||
        event.id.toLowerCase().includes(search.toLowerCase()) ||
        JSON.stringify(event.details).toLowerCase().includes(search.toLowerCase());
      
      const matchesModule = moduleFilter === 'all' || event.module === moduleFilter;
      
      return matchesSearch && matchesModule;
    });
  }, [events, search, moduleFilter]);

  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);

  const formatTimestamp = (ts: number) => {
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEventDescription = (event: ActivityEvent) => {
    const { type, details, module } = event;
    switch (type) {
      case 'deposit': return `Deposited ${details.amount} tokens`;
      case 'w_create': return `Withdrawal proposal #${details.proposalId} created`;
      case 'w_exec': return `Withdrawal executed: ${details.amount} sent to ${details.recipient?.slice(0, 6)}...`;
      case 's_create': return `Payroll stream #${details.streamId} initialized`;
      case 'claim': return `Claimed ${details.amount} tokens from ${module}`;
      case 'v_create': return `Vesting schedule for ${details.beneficiary?.slice(0, 6)}... created`;
      case 'cancel': return `Payroll stream #${details.streamId} cancelled`;
      case 'v_revoke': return `Vesting schedule #${details.scheduleId} revoked`;
      default: return `${type.replace(/_/g, ' ')}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-1 w-full max-w-md items-center gap-2 bg-gray-900 border border-gray-800 rounded-2xl px-4 py-2 text-white transition-all focus-within:border-purple-500">
          <Search size={18} className="text-gray-500" />
          <input 
            type="text" 
            placeholder="Search transactions, IDs, or participants..." 
            className="bg-transparent border-none outline-none text-sm w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 rounded-2xl px-3 py-1.5 overflow-x-auto no-scrollbar">
            {(['all', 'treasury', 'payroll', 'vesting'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setModuleFilter(m)}
                className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  moduleFilter === m 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40" 
                    : "text-gray-500 hover:text-gray-300"
                )}
              >
                {m}
              </button>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            className="gap-2 rounded-2xl border-gray-800 text-gray-400 hover:text-white"
            onClick={() => exportToCSV(filteredEvents)}
          >
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </div>

      <div className="bg-gray-950/20 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Event</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Description</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Module</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Date</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4"><Skeleton className="h-12 w-full rounded-xl" /></td>
                  </tr>
                ))
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 opacity-30">
                      <FileText size={48} className="text-gray-600" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No matching activity found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event) => {
                  const config = MODULE_CONFIG[event.module];
                  const Icon = config.icon;
                  return (
                    <tr key={event.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-xl border transition-all", config.bg, config.border, config.color)}>
                            <Icon size={16} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white uppercase tracking-tighter">{event.type}</p>
                            <p className="text-[10px] font-mono text-gray-600">#{event.id.slice(0, 12)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-300 font-medium">{getEventDescription(event)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="outline" className={cn("border-none px-0 font-black uppercase tracking-widest text-[9px]", config.color)}>
                          {config.label}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-400 font-bold">{formatTimestamp(event.timestamp)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="success" className="text-[9px] font-black uppercase tracking-tighter py-0 h-4">
                          Confirmed
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length}
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg border-gray-800"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 w-8 p-0 rounded-lg border-gray-800"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <AlertCircle size={14} className="text-purple-400" />
                    Data Integrity
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">All events are pulled directly from the Soroban RPC. Activity logs are cryptographic proof of all on-chain operations executed by the OrbitPay smart contracts.</p>
            </CardContent>
        </Card>
        <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <ExternalLink size={14} className="text-blue-400" />
                    Explorer Links
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">Click on any transaction ID to view the full ledger entry on StellarExpert. Detailed XDR data is available for deep technical auditing.</p>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

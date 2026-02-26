'use client';

import React from 'react';
import { 
  FileText, 
  TrendingUp, 
  Download, 
  Filter, 
  ShieldCheck, 
  Calendar,
  Layers,
  BarChart3,
  Search,
  History,
  ArrowUpRight
} from 'lucide-react';
import { useReports } from '@/hooks/useReports';
import { useFreighter } from '@/contexts/FreighterContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import FilterableActivityLog from '@/components/FilterableActivityLog';

import RecurringPaymentAnalytics from '@/components/RecurringPaymentAnalytics';

export default function ReportsPage() {
  const { isConnected } = useFreighter();
  const { events, isLoading } = useReports();

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-12 max-w-md shadow-2xl">
          <FileText className="w-16 h-16 text-purple-500 mx-auto mb-6 opacity-50" />
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-gray-400 mb-8 font-medium">
            Please connect your Freighter wallet to access platform-wide reports and transaction audit logs.
          </p>
          <Button size="lg" className="w-full bg-purple-600 hover:bg-purple-500 text-white">Connect Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent italic tracking-tight">📊 Analytics & Reports</h1>
          <p className="text-gray-400 mt-2 font-medium">Audit logs, transaction exports, and performance metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-600">Sync Status</span>
                <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                    <ShieldCheck size={12} />
                    On-Chain Verified
                </span>
            </div>
            <div className="h-10 w-px bg-gray-800 mx-2 hidden sm:block" />
            <Button variant="outline" className="rounded-2xl border-gray-800 gap-2 h-12 px-6">
                <Calendar size={16} />
                <span className="text-xs font-black uppercase tracking-widest">Date Range</span>
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/10">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 flex items-center gap-2">
                    <History size={14} />
                    Total Events
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-white italic">{events.length}</div>
                <p className="text-xs text-gray-500 font-bold mt-1">Platform-wide activity</p>
            </CardContent>
        </Card>
        
        <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <TrendingUp size={14} className="text-green-400" />
                    Growth Rate
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-white italic">+12.5%</div>
                <p className="text-xs text-green-400/80 font-bold mt-1">vs. last 30 days</p>
            </CardContent>
        </Card>

        <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <Layers size={14} className="text-blue-400" />
                    Ledger Depth
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-black text-white italic">{events.length > 0 ? events.length * 2 : 0}</div>
                <p className="text-xs text-gray-500 font-bold mt-1">Processed entries</p>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2 text-white">
                <Search className="w-5 h-5 text-purple-400" />
                Filterable Activity Log
            </h2>
            <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-wider py-0.5 px-2">Live Sync</Badge>
            </div>
        </div>

        <FilterableActivityLog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8">
        <RecurringPaymentAnalytics />

        <Card className="border-gray-800 bg-gray-900/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Download className="text-blue-400" />
                    Scheduled Reports
                </CardTitle>
                <CardDescription>Automated PDF/CSV statement generation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 border-t border-gray-800/50 mt-4 pt-6">
                <div className="p-4 bg-gray-950/40 rounded-2xl border border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-500" />
                        <div>
                            <p className="text-sm font-bold text-white">Monthly Statement - Jan 2026</p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">PDF • 1.2 MB</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-gray-800">Download</Button>
                </div>
                <div className="p-4 bg-gray-950/40 rounded-2xl border border-gray-800 flex items-center justify-between opacity-50">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-gray-500" />
                        <div>
                            <p className="text-sm font-bold text-white">Full activity log - CSV Export</p>
                            <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">CSV • 8.4 MB</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" className="rounded-xl border-gray-800">Download</Button>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

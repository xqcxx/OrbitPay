'use client';

import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { usePayrollStream } from '@/hooks/usePayrollStream';
import { useVesting } from '@/hooks/useVesting';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Calendar, AlertCircle, Info } from 'lucide-react';

export default function RecurringPaymentAnalytics() {
  const { streams } = usePayrollStream();
  const { schedules } = useVesting();

  const projectionData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    return months.map((month, index) => {
      // Very simple mock logic for demonstration based on active count
      const activeStreams = streams.filter(s => s.status === 'Active').length;
      const activeVesting = schedules.filter(s => !s.revoked).length;
      
      const basePayroll = activeStreams * 500;
      const baseVesting = activeVesting * 1200;
      const seasonal = Math.sin(index) * 200;

      return {
        name: month,
        payroll: Math.max(0, basePayroll + seasonal),
        vesting: Math.max(0, baseVesting + (seasonal * 1.5)),
        total: basePayroll + baseVesting + (seasonal * 2.5)
      };
    });
  }, [streams, schedules]);

  const distributionData = [
    { name: 'Payroll', value: streams.length * 1000, color: '#A855F7' },
    { name: 'Vesting', value: schedules.length * 5000, color: '#6366F1' },
    { name: 'Treasury', value: 2500, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-gray-900/40 border-gray-800 overflow-hidden">
        <CardHeader className="border-b border-gray-800/50 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp size={20} className="text-purple-400" />
                Token Release Projections
              </CardTitle>
              <CardDescription>Estimated outgoing volume based on active schedules and streams.</CardDescription>
            </div>
            <Badge variant="secondary" className="font-black uppercase tracking-tighter text-[10px]">6-Month Outlook</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorVesting" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#4b5563', fontSize: 10, fontWeight: 'bold' }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="payroll" 
                  stroke="#A855F7" 
                  fillOpacity={1} 
                  fill="url(#colorPayroll)" 
                  strokeWidth={3}
                />
                <Area 
                  type="monotone" 
                  dataKey="vesting" 
                  stroke="#6366F1" 
                  fillOpacity={1} 
                  fill="url(#colorVesting)" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex items-center gap-6 mt-8 pt-6 border-t border-gray-800/50">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Payroll Streams</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Vesting Grants</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar size={14} className="text-blue-400" />
                    Next Major Unlock
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xl font-black text-white italic">March 14, 2026</p>
                        <p className="text-xs text-gray-500 font-bold">Cliff expiry for Seed Round</p>
                    </div>
                    <Badge variant="warning" className="animate-pulse">Upcoming</Badge>
                </div>
            </CardContent>
      </Card>

      <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                    <Info size={14} className="text-purple-400" />
                    Liquidity Warning
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-start gap-3">
                    <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-gray-500 leading-relaxed font-medium"> Ensure the Treasury contains sufficient funds for the projected 30-day outgoing volume of 4,200 tokens.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

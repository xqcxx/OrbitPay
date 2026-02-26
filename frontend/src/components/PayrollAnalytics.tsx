'use client'

import React from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { usePayrollStream } from '@/hooks/usePayrollStream'

const data = [
    { name: 'Mon', amount: 400 },
    { name: 'Tue', amount: 300 },
    { name: 'Wed', amount: 600 },
    { name: 'Thu', amount: 800 },
    { name: 'Fri', amount: 500 },
    { name: 'Sat', amount: 900 },
    { name: 'Sun', amount: 1100 },
]

export default function PayrollAnalytics() {
    const { streams } = usePayrollStream()

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="h-[200px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                        <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fill: '#4b5563', fontSize: 10, fontWeight: 'bold'}}
                            dy={10}
                        />
                        <YAxis hide />
                        <Tooltip 
                            contentStyle={{ 
                                backgroundColor: '#111827', 
                                border: '1px solid #374151', 
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 'bold'
                            }}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="amount" 
                            stroke="#3b82f6" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorAmount)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Avg. Rate</p>
                    <p className="text-lg font-black text-white italic">$42.50<span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">/HR</span></p>
                </div>
                <div className="bg-gray-950/50 border border-gray-800 rounded-2xl p-4 space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">Recipients</p>
                    <p className="text-lg font-black text-white italic">{new Set(streams.map(s => s.recipient)).size}<span className="text-[10px] text-gray-500 font-bold ml-1 uppercase">Users</span></p>
                </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500">Distribution</h4>
                    <span className="text-[10px] text-blue-400 font-bold">Top 3 Tokens</span>
                </div>
                <div className="space-y-3">
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-gray-400">USDC</span>
                            <span className="text-white">65%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 w-[65%]" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <div className="flex justify-between text-[11px] font-bold">
                            <span className="text-gray-400">XLM</span>
                            <span className="text-white">25%</span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-[25%]" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

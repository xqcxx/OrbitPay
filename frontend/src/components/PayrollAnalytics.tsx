"use client"

import React, { useState } from 'react'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

// Mock Data Models
const DISBURSEMENT_DATA = [
    { month: 'Jan', total: 12000, activeStreams: 4 },
    { month: 'Feb', total: 18000, activeStreams: 5 },
    { month: 'Mar', total: 25000, activeStreams: 8 },
    { month: 'Apr', total: 22000, activeStreams: 8 },
    { month: 'May', total: 30000, activeStreams: 10 },
    { month: 'Jun', total: 45000, activeStreams: 12 },
    { month: 'Jul', total: 42000, activeStreams: 12 },
]

const EMPLOYEE_DISTRIBUTION = [
    { name: 'Alice', amount: 8000 },
    { name: 'Bob', amount: 7500 },
    { name: 'Charlie', amount: 6200 },
    { name: 'Diana', amount: 10500 },
    { name: 'Ethan', amount: 5000 },
    { name: 'Fiona', amount: 4800 },
]

export const PayrollAnalytics = () => {
    const [activeTab, setActiveTab] = useState<'trends' | 'distribution'>('trends')

    // Calculated stats based on mock data
    const totalDisbursed = DISBURSEMENT_DATA.reduce((acc, curr) => acc + curr.total, 0)
    const currentActiveStreams = DISBURSEMENT_DATA[DISBURSEMENT_DATA.length - 1].activeStreams
    const totalStreamsHistorically = 14

    return (
        <div className="flex flex-col gap-6">
            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-stellar-surface border border-stellar-border rounded-xl p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Disbursed</p>
                    <p className="text-3xl font-bold text-white">${totalDisbursed.toLocaleString()}</p>
                </div>
                <div className="bg-stellar-surface border border-stellar-border rounded-xl p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Active Streams</p>
                    <p className="text-3xl font-bold text-white">{currentActiveStreams}</p>
                </div>
                <div className="bg-stellar-surface border border-stellar-border rounded-xl p-6 shadow-sm">
                    <p className="text-sm font-medium text-gray-400 uppercase tracking-widest mb-1">Total Streams</p>
                    <p className="text-3xl font-bold text-white">{totalStreamsHistorically}</p>
                </div>
            </div>

            {/* Chart Sections */}
            <div className="bg-stellar-surface border border-stellar-border rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Payroll Analytics</h2>
                    <div className="flex bg-[#0D1117] rounded-lg p-1 border border-stellar-border">
                        <button
                            onClick={() => setActiveTab('trends')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'trends' ? 'bg-stellar-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Disbursement Trends
                        </button>
                        <button
                            onClick={() => setActiveTab('distribution')}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'distribution' ? 'bg-stellar-primary text-white' : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Employee Distribution
                        </button>
                    </div>
                </div>

                <div className="h-[400px] w-full">
                    {activeTab === 'trends' ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={DISBURSEMENT_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                                <XAxis dataKey="month" stroke="#8b949e" tick={{ fill: '#8b949e' }} tickMargin={12} />
                                <YAxis
                                    stroke="#8b949e"
                                    tick={{ fill: '#8b949e' }}
                                    tickFormatter={(val) => `$${val / 1000}k`}
                                    tickMargin={12}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Line
                                    type="monotone"
                                    dataKey="total"
                                    name="Total Payroll ($)"
                                    stroke="#7B61FF"
                                    strokeWidth={3}
                                    activeDot={{ r: 6, fill: '#00C2FF' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={EMPLOYEE_DISTRIBUTION} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                                <XAxis dataKey="name" stroke="#8b949e" tick={{ fill: '#8b949e' }} tickMargin={12} />
                                <YAxis
                                    stroke="#8b949e"
                                    tick={{ fill: '#8b949e' }}
                                    tickFormatter={(val) => `$${val / 1000}k`}
                                    tickMargin={12}
                                />
                                <Tooltip
                                    cursor={{ fill: '#30363D', opacity: 0.4 }}
                                    contentStyle={{ backgroundColor: '#161B22', border: '1px solid #30363D', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="amount" name="Allocated Amount ($)" fill="#00C2FF" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    )
}

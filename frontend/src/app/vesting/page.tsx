'use client'

import React, { useState } from 'react';
import ClaimModal from '@/components/ClaimModal';
import VestingTimeline from '@/components/VestingTimeline';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface MockSchedule {
  id: number;
  label: string;
  total_amount: string;
  vested_amount: string;
  claimed_amount: string;
  claimable_amount: string;
  token: string;
  status: string;
  startTime: number;
  cliffDuration: number;
  totalDuration: number;
  totalAmountBig: bigint;
  vestedAmountBig: bigint;
  claimedAmountBig: bigint;
}

const MOCK_SCHEDULES: MockSchedule[] = [
  {
    id: 1,
    label: "Team Allocation",
    total_amount: "10,000",
    vested_amount: "6,000",
    claimed_amount: "2,000",
    claimable_amount: "4,000",
    token: "ORBT",
    status: "Active",
    startTime: Math.floor(Date.now() / 1000) - 3600 * 24 * 365, // 1 year ago
    cliffDuration: 3600 * 24 * 365, // 1 year
    totalDuration: 3600 * 24 * 365 * 4, // 4 years
    totalAmountBig: BigInt(100000000000),
    vestedAmountBig: BigInt(60000000000),
    claimedAmountBig: BigInt(20000000000),
  },
  {
    id: 2,
    label: "Advisor Grant",
    total_amount: "5,000",
    vested_amount: "0",
    claimed_amount: "0",
    claimable_amount: "0",
    token: "ORBT",
    status: "Cliff Period",
    startTime: Math.floor(Date.now() / 1000) - 3600 * 24 * 30, // 30 days ago
    cliffDuration: 3600 * 24 * 180, // 6 months
    totalDuration: 3600 * 24 * 365 * 2, // 2 years
    totalAmountBig: BigInt(50000000000),
    vestedAmountBig: BigInt(0),
    claimedAmountBig: BigInt(0),
  }
];

export default function VestingPage() {
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleClaimSuccess = (amount: string) => {
    setSelectedScheduleId(null);
    setSuccessMessage(`Successfully claimed ${amount} tokens!`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">⏳ Token Vesting</h1>
          <p className="text-gray-400 mt-2">
            Manage your vested token allocations and claim rewards.
          </p>
        </div>
      </div>

      {successMessage && (
        <div className="mb-6 bg-green-900/20 border border-green-500/50 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="text-green-500" size={24} />
          <p className="text-green-100 font-medium">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_SCHEDULES.map((schedule) => (
          <div key={schedule.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-purple-500/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">{schedule.label}</h3>
                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${schedule.status === 'Active' ? 'bg-green-900/30 text-green-500' : 'bg-orange-900/30 text-orange-500'
                  }`}>
                  {schedule.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-white">{schedule.total_amount}</p>
                <p className="text-xs text-gray-500 uppercase">{schedule.token}</p>
              </div>
            </div>

            <div className="space-y-6">
              <VestingTimeline
                startTime={schedule.startTime}
                cliffDuration={schedule.cliffDuration}
                totalDuration={schedule.totalDuration}
                totalAmount={schedule.totalAmountBig}
                vestedAmount={schedule.vestedAmountBig}
                claimedAmount={schedule.claimedAmountBig}
              />

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Claimable</span>
                <span className="text-purple-400 font-bold">{schedule.claimable_amount} {schedule.token}</span>
              </div>

              <button
                onClick={() => setSelectedScheduleId(schedule.id)}
                className="w-full py-3 bg-gray-800 hover:bg-purple-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-900/10"
              >
                View & Claim
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State Mock */}
      <div className="mt-12 border border-dashed border-gray-800 rounded-2xl p-12 text-center">
        <p className="text-gray-600">No more vesting schedules found for your address.</p>
      </div>

      {selectedScheduleId !== null && (
        <ClaimModal
          schedule_id={selectedScheduleId}
          isOpen={true}
          onClose={() => setSelectedScheduleId(null)}
          onSuccess={handleClaimSuccess}
        />
      )}
    </div>
  )
}

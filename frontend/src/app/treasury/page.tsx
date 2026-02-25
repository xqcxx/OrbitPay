'use client'

import SignerManagementPanel from '@/components/SignerManagementPanel'
import { useFreighter } from '@/contexts/FreighterContext'
import { Lock, ShieldAlert } from 'lucide-react'

export default function TreasuryPage() {
  const { publicKey, isConnected } = useFreighter()

  // For demonstration, let's treat the first mock signer or any connected wallet as "authorized" 
  // to see the panel, but typically this would be a specific admin address.
  // We'll define a pseudo-admin check here.
  const isAdmin = isConnected && publicKey !== null

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
          <span className="bg-blue-500/10 p-2 rounded-xl">🏦</span>
          Treasury
        </h1>
        <p className="text-gray-400">
          Multi-sig treasury management with configurable approval thresholds.
        </p>
      </div>

      {/* Treasury Stats Stub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Value Locked', value: '$0.00', icon: '💰' },
          { label: 'Pending Proposals', value: '0', icon: '📝' },
          { label: 'Available Assets', value: '0', icon: '💎' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-800/40 border border-gray-700/50 p-6 rounded-2xl">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
            <div className="text-2xl font-bold mt-1 text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Conditional Admin Section */}
      {isAdmin ? (
        <div className="pt-8 border-t border-gray-800">
          <SignerManagementPanel />
        </div>
      ) : (
        <div className="bg-gray-900/40 border border-dashed border-gray-700/50 rounded-3xl p-16 text-center max-w-2xl mx-auto">
          <div className="bg-gray-800/50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-3">Admin Access Required</h3>
          <p className="text-gray-400 mb-8 leading-relaxed">
            The signer management panel and threshold settings are only accessible to the authorized treasury administrator.
          </p>
          {!isConnected && (
            <div className="flex items-center justify-center gap-2 text-blue-400 text-sm font-medium">
              <ShieldAlert className="w-4 h-4" />
              Connect your admin wallet to proceed
            </div>
          )}
        </div>
      )}
    </div>
  )
}

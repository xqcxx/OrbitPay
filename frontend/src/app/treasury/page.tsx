'use client'

import TransactionHistory from "@/components/TransactionHistory";
import { useFreighter } from "@/contexts/FreighterContext";
import DepositModal from "@/components/DepositModal";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function TreasuryPage() {
	const { publicKey, isConnected } = useFreighter();
	const [showDepositModal, setShowDepositModal] = useState(false);

  // For demonstration, let's treat the first mock signer or any connected wallet as "authorized" 
  // to see the panel, but typically this would be a specific admin address.
  // We'll define a pseudo-admin check here.
  const isAdmin = isConnected && publicKey !== null

  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">🏦 Treasury</h1>
      <p className="text-gray-400 mb-8">
        Multi-sig treasury management with configurable approval thresholds.
      </p>

      <div className="mb-8">
        <TransactionHistory />
      </div>

      {/* TODO: Implement Treasury Dashboard (see FE-6 to FE-10) */}
      <div className="border border-dashed border-gray-600 rounded-xl p-12 text-center text-gray-500">
        Treasury dashboard coming soon. See ISSUES-FRONTEND.md for contribution tasks.
      </div>

	{/* Deposit Button */}
	<div className="mb-8">
		<button
			onClick={() => setShowDepositModal(true)}
			className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 shadow-lg"
		>
			<Plus size={20} />
			Deposit
		</button>
	</div>

	{/* Treasury Stats Stub */}
	<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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

	{/* Deposit Modal */}
	<DepositModal
		isOpen={showDepositModal}
		onClose={() => setShowDepositModal(false)}
		onSuccess={(amount, token) => {
			console.log(`Deposited ${amount} ${token}`);
		}}
	/>
</div>
);
}

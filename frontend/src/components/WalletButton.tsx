/**
 * Wallet Connect Button Component (scaffold).
 * Contributors: see FE-3 for full implementation.
 *
 * States to implement:
 * - Disconnected: Show "Connect Wallet" button
 * - Connecting: Show spinner/loading state
 * - Connected: Show truncated wallet address
 * - Error: Show error state with retry
 */

'use client'

export default function WalletButton() {
  // TODO: Implement wallet connection states (contributor task FE-3)
  return (
    <button className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors">
      Connect Wallet
    </button>
  )
}

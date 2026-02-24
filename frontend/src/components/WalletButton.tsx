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
    <button className="rounded-lg bg-sky-500 px-4 py-2 font-medium text-slate-950 transition-colors hover:bg-sky-400">
      Connect Wallet
    </button>
  )
}

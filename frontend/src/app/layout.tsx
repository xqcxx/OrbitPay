import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'OrbitPay — Decentralized Payroll & Treasury on Stellar',
  description:
    'Manage payroll streaming, token vesting, and multi-sig treasury operations on-chain with Stellar Soroban smart contracts.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {/* TODO: Add FreighterProvider wrapper (see FE-2) */}
        {/* TODO: Add Navbar component (see FE-3) */}
        <main className="min-h-screen">{children}</main>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import Footer from '@/components/Footer'
import Navbar from '@/components/Navbar'
import { FreighterProvider } from '@/contexts/FreighterContext'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

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
      <body className={inter.className}>
        {/* TODO: Add FreighterProvider wrapper (see FE-2) */}
        <FreighterProvider>
          <div className="flex min-h-screen flex-col bg-[rgb(var(--background))] text-[rgb(var(--foreground))] antialiased">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </FreighterProvider>
      </body>
    </html>
  )
}

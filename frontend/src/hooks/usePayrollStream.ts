'use client'

import { useEffect, useState } from 'react'

export type StreamStatus = 'Active' | 'Paused' | 'Cancelled' | 'Completed'

export interface Stream {
  id: string
  sender: string
  recipient: string
  token: string
  totalAmount: number
  amountStreamed: number
  ratePerSecond: number
  startTime: number
  endTime: number
  status: StreamStatus
}

// Mock Data for FE-12 Development
const MOCK_STREAMS: Stream[] = [
  {
    id: 'stream-1',
    sender: 'me',
    recipient: 'G...ABCD',
    token: 'USDC',
    totalAmount: 5000,
    amountStreamed: 2500,
    ratePerSecond: 0.001,
    startTime: Date.now() - 2500000,
    endTime: Date.now() + 2500000,
    status: 'Active',
  },
  {
    id: 'stream-2',
    sender: 'G...XYZ',
    recipient: 'me',
    token: 'XLM',
    totalAmount: 10000,
    amountStreamed: 10000,
    ratePerSecond: 0.005,
    startTime: Date.now() - 5000000,
    endTime: Date.now() - 1000,
    status: 'Completed',
  },
  {
    id: 'stream-3',
    sender: 'me',
    recipient: 'G...789',
    token: 'USDC',
    totalAmount: 2000,
    amountStreamed: 500,
    ratePerSecond: 0.0005,
    startTime: Date.now() - 1000000,
    endTime: Date.now() + 3000000,
    status: 'Paused',
  }
]

/**
 * Hook to interact with the Payroll Stream contract.
 * Contributors: see FE-11 for full implementation.
 */
export function usePayrollStream() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate data fetching
    setTimeout(() => {
      setStreams(MOCK_STREAMS)
      setIsLoading(false)
    }, 1000)
  }, [])

  return {
    streams,
    isLoading,
    createStream: async (
      _recipient: string,
      _token: string,
      _amount: number,
      _startTime: number,
      _endTime: number
    ) => { },
    claimFromStream: async (_streamId: string) => { },
    cancelStream: async (_streamId: string) => { },
    getClaimable: async (_streamId: string) => 0,
  }
}

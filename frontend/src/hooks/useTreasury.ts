'use client'

import { useState, useEffect } from 'react'

export interface Signer {
  address: string
  weight: number
}

/**
 * Hook to interact with the Treasury contract.
 * Contributors: see FE-6 for full implementation.
 */
export function useTreasury() {
  const [signers, setSigners] = useState<Signer[]>([])
  const [threshold, setThreshold] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Mock fetching initial treasury state
    setTimeout(() => {
      setSigners([
        { address: 'GB...ADMIN', weight: 1 },
        { address: 'GC...SIGNER1', weight: 1 },
        { address: 'GD...SIGNER2', weight: 1 },
      ])
      setThreshold(2)
      setIsLoading(false)
    }, 1000)
  }, [])

  const addSigner = async (address: string, weight: number) => {
    // Simulate contract call
    setSigners(prev => [...prev, { address, weight }])
  }

  const removeSigner = async (address: string) => {
    // Simulate contract call
    setSigners(prev => prev.filter(s => s.address !== address))
  }

  const updateThreshold = async (newThreshold: number) => {
    // Simulate contract call
    setThreshold(newThreshold)
  }

  return {
    signers,
    threshold,
    proposals: [],
    isLoading,
    addSigner,
    removeSigner,
    updateThreshold,
    deposit: async (_token: string, _amount: number) => { },
    createWithdrawal: async (_token: string, _recipient: string, _amount: number) => { },
    approveWithdrawal: async (_proposalId: number) => { },
  }
}

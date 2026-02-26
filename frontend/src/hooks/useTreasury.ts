'use client'

import { useState, useEffect, useCallback } from 'react';
import { CONTRACTS } from '@/lib/network';
import { getSorobanServer } from '@/lib/soroban';
import { xdr, Address, scValToNative } from '@stellar/stellar-sdk';

export type TreasuryEventType =
  | 'initialized'
  | 'deposit'
  | 'withdrawal_created'
  | 'withdrawal_approved'
  | 'withdrawal_executed'
  | 'signer_added'
  | 'signer_removed'
  | 'threshold_updated';

export interface TreasuryEvent {
  id: string;
  type: TreasuryEventType;
  timestamp: number;
  ledger: number;
  details: {
    amount?: string;
    token?: string;
    recipient?: string;
    proposer?: string;
    signer?: string;
    proposalId?: number;
    threshold?: number;
    admin?: string;
  };
}

export interface TreasuryTransactionHistory {
  events: TreasuryEvent[];
  total: number;
  hasMore: boolean;
}

export interface Signer {
  address: string;
  weight: number;
}

/**
 * Hook to interact with the Treasury contract.
 */
export function useTreasury() {
  const [isLoading, setIsLoading] = useState(false);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState<number>(0);
  const [transactionHistory, setTransactionHistory] = useState<TreasuryTransactionHistory>({
    events: [],
    total: 0,
    hasMore: false,
  });

  const fetchTransactionHistory = async (
    limit: number = 20,
    cursor?: string,
    eventType?: string
  ): Promise<TreasuryTransactionHistory> => {
    if (!CONTRACTS.treasury) {
      throw new Error('Treasury contract not deployed');
    }

    const server = getSorobanServer();

    try {
      // Get events from the contract
      const eventsResponse = await server.getEvents({
        startLedger: 1,
        filters: [{
          contractIds: [CONTRACTS.treasury],
          topics: eventType ? [[
            xdr.ScVal.scvSymbol(eventType).toXDR('base64')
          ]] : undefined,
        }],
        limit,
        cursor,
      });

      const events: TreasuryEvent[] = eventsResponse.events.map((event) => {
        const topic = event.topic;
        const value = event.value;
        const eventSymbol = topic[0].sym().toString();

        let type: TreasuryEvent['type'];
        let details: TreasuryEvent['details'] = {};

        switch (eventSymbol) {
          case 'init':
            type = 'initialized';
            details.admin = Address.fromScVal(topic[1]).toString();
            break;
          case 'deposit':
            type = 'deposit';
            details.recipient = Address.fromScVal(topic[1]).toString();
            details.amount = scValToNative(value).toString();
            break;
          case 'w_create':
            type = 'withdrawal_created';
            details.proposer = Address.fromScVal(topic[1]).toString();
            details.proposalId = scValToNative(value) as number;
            break;
          case 'approve':
            type = 'withdrawal_approved';
            details.signer = Address.fromScVal(topic[1]).toString();
            details.proposalId = scValToNative(value) as number;
            break;
          case 'w_exec':
            type = 'withdrawal_executed';
            details.recipient = Address.fromScVal(topic[1]).toString();
            details.amount = scValToNative(value).toString();
            break;
          case 's_add':
            type = 'signer_added';
            details.signer = Address.fromScVal(value).toString();
            break;
          case 's_remove':
            type = 'signer_removed';
            details.signer = Address.fromScVal(value).toString();
            break;
          case 't_upd':
            type = 'threshold_updated';
            details.threshold = scValToNative(value) as number;
            break;
          default:
            type = 'deposit'; // fallback
        }

        const timestamp = event.ledgerClosedAt ? new Date(event.ledgerClosedAt).getTime() / 1000 : Date.now() / 1000;

        return {
          id: event.id,
          type,
          timestamp,
          ledger: event.ledger,
          details,
        };
      });

      return {
        events,
        total: eventsResponse.events.length,
        hasMore: eventsResponse.events.length === limit,
      };
    } catch (error) {
      console.error('Error fetching treasury events:', error);
      throw error;
    }
  };

  const loadTransactionHistory = useCallback(async (
    limit: number = 20,
    cursor?: string,
    eventType?: string
  ) => {
    setIsLoading(true);
    try {
      const history = await fetchTransactionHistory(limit, cursor, eventType);
      setTransactionHistory(history);
    } catch (error) {
      console.error('Error loading transaction history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTransactionHistory();
  }, [loadTransactionHistory]);

  const addSigner = async (address: string, weight: number) => {
    console.log('Adding signer:', address, weight);
    // TODO: Implement actual contract call
  };

  const removeSigner = async (address: string) => {
    console.log('Removing signer:', address);
    // TODO: Implement actual contract call
  };

  const updateThreshold = async (newThreshold: number) => {
    console.log('Updating threshold:', newThreshold);
    // TODO: Implement actual contract call
  };

  return {
    signers,
    threshold,
    proposals: [],
    isLoading,
    transactionHistory,
    loadTransactionHistory,
    addSigner,
    removeSigner,
    updateThreshold,
    deposit: async (_token: string, _amount: number) => {},
    createWithdrawal: async (_token: string, _recipient: string, _amount: number) => {},
    approveWithdrawal: async (_proposalId: number) => {},
  }
}

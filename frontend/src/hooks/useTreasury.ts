'use client'

import { useState, useEffect } from 'react';
import { getSorobanServer, CONTRACTS } from '@/lib/network';
import { xdr, Address, scValToNative } from '@stellar/stellar-sdk';

export interface TreasuryEvent {
  id: string;
  type: 'deposit' | 'withdrawal_created' | 'withdrawal_approved' | 'withdrawal_executed' | 'signer_added' | 'signer_removed' | 'threshold_updated' | 'initialized';
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

/**
 * Hook to interact with the Treasury contract.
 */
export function useTreasury() {
  const [isLoading, setIsLoading] = useState(false);
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
    if (!server) {
      throw new Error('Soroban server not configured');
    }

    try {
      // Get events from the contract
      const eventsResponse = await server.getEvents({
        startLedger: 1,
        filters: [{
          contractIds: [CONTRACTS.treasury],
          topics: eventType ? [[
            xdr.ScVal.scvSymbol(xdr.ScSymbol.symbol(eventType))
          ]] : undefined,
        }],
        limit,
        cursor,
      });

      const events: TreasuryEvent[] = eventsResponse.events.map((event) => {
        const topic = event.topic;
        const data = event.data;
        const eventType = topic[0].sym().toString();

        let type: TreasuryEvent['type'];
        let details: TreasuryEvent['details'] = {};

        switch (eventType) {
          case 'init':
            type = 'initialized';
            details.admin = Address.fromScVal(topic[1]).toString();
            break;
          case 'deposit':
            type = 'deposit';
            details.recipient = Address.fromScVal(topic[1]).toString();
            details.amount = scValToNative(data).toString();
            break;
          case 'w_create':
            type = 'withdrawal_created';
            details.proposer = Address.fromScVal(topic[1]).toString();
            details.proposalId = scValToNative(data) as number;
            break;
          case 'approve':
            type = 'withdrawal_approved';
            details.signer = Address.fromScVal(topic[1]).toString();
            details.proposalId = scValToNative(data) as number;
            break;
          case 'w_exec':
            type = 'withdrawal_executed';
            details.recipient = Address.fromScVal(topic[1]).toString();
            details.amount = scValToNative(data).toString();
            break;
          case 's_add':
            type = 'signer_added';
            details.signer = Address.fromScVal(data).toString();
            break;
          case 's_remove':
            type = 'signer_removed';
            details.signer = Address.fromScVal(data).toString();
            break;
          case 't_upd':
            type = 'threshold_updated';
            details.threshold = scValToNative(data) as number;
            break;
          default:
            type = 'deposit'; // fallback
        }

        return {
          id: event.id,
          type,
          timestamp: event.createdAt,
          ledger: event.ledger,
          details,
        };
      });

      return {
        events,
        total: eventsResponse.events.length,
        hasMore: eventsResponse.cursor !== undefined,
      };
    } catch (error) {
      console.error('Error fetching treasury events:', error);
      throw error;
    }
  };

  const loadTransactionHistory = async (
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
  };

  useEffect(() => {
    loadTransactionHistory();
  }, []);

  return {
    signers,
    threshold,
    proposals: [],
    isLoading,
    transactionHistory,
    loadTransactionHistory,
    deposit: async (_token: string, _amount: number) => {},
    createWithdrawal: async (_token: string, _recipient: string, _amount: number) => {},
    approveWithdrawal: async (_proposalId: number) => {},
  }
}

'use client'

import { useState, useEffect } from 'react';
import { getSorobanServer, CONTRACTS, NETWORK, buildTransaction, addressToScVal, i128ToScVal } from '@/lib/network';
import { xdr, Address, scValToNative, Contract, TransactionBuilder, nativeToScVal } from '@stellar/stellar-sdk';
import { useFreighter } from '@/contexts/FreighterContext';

const DUMMY_ADDRESS = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

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

export interface WithdrawalRequest {
  id: number;
  proposer: string;
  token: string;
  recipient: string;
  amount: bigint;
  memo: string;
  approvals: string[];
  status: 'Pending' | 'Approved' | 'Executed' | 'Cancelled';
  createdAt: number;
}

/**
 * Hook to interact with the Treasury contract.
 */
export function useTreasury() {
  const { publicKey } = useFreighter();
  const [isLoading, setIsLoading] = useState(false);
  const [proposals, setProposals] = useState<WithdrawalRequest[]>([]);
  const [threshold, setThreshold] = useState<number>(0);
  const [signers, setSigners] = useState<string[]>([]);
  const [admin, setAdmin] = useState<string | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<TreasuryTransactionHistory>({
    events: [],
    total: 0,
    hasMore: false,
  });

  const fetchConfig = async () => {
    if (!CONTRACTS.treasury) return;
    const server = getSorobanServer();
    try {
      const contract = new Contract(CONTRACTS.treasury);
      
      // Get threshold
      const thresholdResult = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase
        }).addOperation(contract.call('get_threshold')).build()
      );
      if (!('error' in thresholdResult)) {
        setThreshold(scValToNative(thresholdResult.result!.retval) as number);
      }

      // Get admin
      const adminResult = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase
        }).addOperation(contract.call('get_admin')).build()
      );
      if (!('error' in adminResult)) {
        setAdmin((scValToNative(adminResult.result!.retval) as any).toString());
      }

      // Get signers
      const signersResult = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase
        }).addOperation(contract.call('get_signers')).build()
      );
      if (!('error' in signersResult)) {
        const nativeSigners = scValToNative(signersResult.result!.retval) as any[];
        setSigners(nativeSigners.map(s => s.toString()));
      }
    } catch (error) {
      console.error('Error fetching treasury config:', error);
    }
  };

  const fetchProposals = async () => {
    if (!CONTRACTS.treasury) return;
    setIsLoading(true);
    const server = getSorobanServer();
    try {
      // Get proposal count
      const countResult = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase
        }).addOperation(new Contract(CONTRACTS.treasury).call('get_proposal_count')).build()
      );
      
      if ('error' in countResult) throw new Error('Failed to fetch proposal count');
      const count = scValToNative(countResult.result!.retval) as number;
      
      const fetchedProposals: WithdrawalRequest[] = [];
      for (let i = 0; i < count; i++) {
        const propResult = await server.simulateTransaction(
          new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
            fee: '100',
            networkPassphrase: NETWORK.networkPassphrase
          }).addOperation(new Contract(CONTRACTS.treasury).call('get_withdrawal', nativeToScVal(i, { type: 'u32' }))).build()
        );
        
        if (!('error' in propResult)) {
          const p = scValToNative(propResult.result!.retval);
          fetchedProposals.push({
            id: Number(p.id),
            proposer: p.proposer.toString(),
            token: p.token.toString(),
            recipient: p.recipient.toString(),
            amount: BigInt(p.amount),
            memo: p.memo.toString(),
            approvals: p.approvals.map((a: any) => a.toString()),
            status: ['Pending', 'Approved', 'Executed', 'Cancelled'][p.status] as any,
            createdAt: Number(p.created_at),
          });
        }
      }
      setProposals(fetchedProposals.reverse()); // Show newest first
    } catch (error) {
      console.error('Error fetching proposals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createWithdrawal = async (token: string, recipient: string, amount: string, memo: string) => {
    if (!CONTRACTS.treasury) throw new Error('Treasury contract not set');
    
    // We need the user's public key from context, but since this is a hook, 
    // the caller should ideally provide it or we use a wallet helper.
    // For now, let's assume the caller handles the signing flow or we provide the XDR builder.
    
    const amountBigInt = BigInt(amount); // Assumes already scaled by decimals
    
    const { xdr: txXdr } = await buildTransaction({
        contractId: CONTRACTS.treasury,
        method: 'create_withdrawal',
        args: [
            addressToScVal(publicKey!), // This needs to be available
            addressToScVal(token),
            addressToScVal(recipient),
            i128ToScVal(amountBigInt),
            xdr.ScVal.scvSymbol(memo)
        ],
        publicKey: publicKey!
    });
    
    return txXdr;
  };

  const approveWithdrawal = async (proposalId: number) => {
      if (!CONTRACTS.treasury) throw new Error('Treasury contract not set');
      
      const { xdr: txXdr } = await buildTransaction({
          contractId: CONTRACTS.treasury,
          method: 'approve_withdrawal',
          args: [
              addressToScVal(publicKey!),
              nativeToScVal(proposalId, { type: 'u32' })
          ],
          publicKey: publicKey!
      });
      
      return txXdr;
  };

  const executeWithdrawal = async (proposalId: number) => {
      if (!CONTRACTS.treasury) throw new Error('Treasury contract not set');
      
      const { xdr: txXdr } = await buildTransaction({
          contractId: CONTRACTS.treasury,
          method: 'execute_withdrawal',
          args: [
              addressToScVal(publicKey!),
              nativeToScVal(proposalId, { type: 'u32' })
          ],
          publicKey: publicKey!
      });
      
      return txXdr;
  };

  const [balances, setBalances] = useState<Record<string, bigint>>({});

  const fetchBalance = async (tokenAddress: string) => {
    if (!CONTRACTS.treasury) return;
    const server = getSorobanServer();
    try {
      const contract = new Contract(CONTRACTS.treasury);
      const result = await server.simulateTransaction(
        new TransactionBuilder(await server.getAccount(DUMMY_ADDRESS), {
          fee: '100',
          networkPassphrase: NETWORK.networkPassphrase
        }).addOperation(contract.call('get_balance', addressToScVal(tokenAddress))).build()
      );
      if (!('error' in result)) {
        const balance = scValToNative(result.result!.retval) as bigint;
        setBalances(prev => ({ ...prev, [tokenAddress]: balance }));
      }
    } catch (error) {
      console.error(`Error fetching balance for ${tokenAddress}:`, error);
    }
  };

  const fetchTransactionHistory = async (
    limit: number = 20,
    cursor?: string,
    eventType?: string
  ): Promise<TreasuryTransactionHistory> => {
    if (!CONTRACTS.treasury) {
      return { events: [], total: 0, hasMore: false };
    }

    const server = getSorobanServer();
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

      const events: TreasuryEvent[] = eventsResponse.events.map((event: any) => {
        const topic = event.topic;
        const data = event.data;
        const eventType = topic[0].sym().toString();

        let type: TreasuryEvent['type'];
        let details: TreasuryEvent['details'] = {};

        switch (eventType) {
          case 'TreasuryInitialized':
            type = 'initialized';
            break;
          case 'TreasuryDeposit':
            type = 'deposit';
            break;
          case 'WithdrawalCreated':
            type = 'withdrawal_created';
            break;
          case 'WithdrawalApproved':
            type = 'withdrawal_approved';
            break;
          case 'WithdrawalExecuted':
            type = 'withdrawal_executed';
            break;
          case 'SignerAdded':
            type = 'signer_added';
            break;
          case 'SignerRemoved':
            type = 'signer_removed';
            break;
          case 'ThresholdUpdated':
            type = 'threshold_updated';
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
      return { events: [], total: 0, hasMore: false };
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
    if (CONTRACTS.treasury) {
        fetchConfig();
        fetchProposals();
        loadTransactionHistory();
        // Fetch known token balances
        fetchBalance('CDLZFC3SYJYDZW7KZN6H7MXTRJLWUQQ3TA3TLX5RLWOZ7TN6DOKYC4GY'); // XLM
        fetchBalance('CCJZ3LU7PC7UUDLR7HHGL7VP3A7X4TS7YPXXPWUPZO33SRFHIJ2BHC3L'); // USDC
    }
  }, []);

  return {
    admin,
    signers,
    threshold,
    proposals,
    balances,
    isLoading,
    transactionHistory,
    loadTransactionHistory,
    fetchProposals,
    createWithdrawal,
    approveWithdrawal,
    executeWithdrawal,
  }
}

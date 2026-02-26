'use client'

import { useState, useEffect, useCallback } from 'react';
import { CONTRACTS, NETWORK, NETWORKS } from '@/lib/network';
import { getSorobanServer } from '@/lib/soroban';
import { xdr, Address, scValToNative, nativeToScVal, Contract, TransactionBuilder, rpc } from '@stellar/stellar-sdk';
import { signTransaction } from '@/lib/wallet';

const STROOP_SCALE = 10_000_000n;

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

export interface Proposal {
  id: number;
  proposer: string;
  token: string;
  recipient: string;
  amount: string;
  approvals: string[];
  executed: boolean;
  createdAt: number;
}

function decimalToI128(value: string): bigint {
	const trimmed = value.trim();
	if (!/^\d+(\.\d{1,7})?$/.test(trimmed)) {
		throw new Error("Amount must be a positive number with up to 7 decimals");
	}

	const [wholePart, fractionPart = ""] = trimmed.split(".");
	const paddedFraction = fractionPart.padEnd(7, "0");
	const whole = BigInt(wholePart) * STROOP_SCALE;
	const fraction = BigInt(paddedFraction || "0");
	const total = whole + fraction;

	if (total <= 0n) {
		throw new Error("Amount must be greater than zero");
	}

	return total;
}

/**
 * Hook to interact with the Treasury contract.
 */
export function useTreasury() {
  const [isLoading, setIsLoading] = useState(false);
  const [signers, setSigners] = useState<Signer[]>([]);
  const [threshold, setThreshold] = useState<number>(0);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TreasuryTransactionHistory>({
    events: [],
    total: 0,
    hasMore: false,
  });

  const fetchTreasuryData = useCallback(async () => {
    if (!CONTRACTS.treasury) return;

    const server = getSorobanServer();
    const contract = new Contract(CONTRACTS.treasury);

    try {
      // For simulation, we need a dummy account or actual connected public key
      const { Freighter } = await import("@stellar/freighter-api");
      let publicKey: string;
      try {
        publicKey = await Freighter.getPublicKey();
      } catch {
        // Fallback to a dummy address if wallet not connected, just for simulation
        publicKey = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
      }

      const account = await server.getAccount(publicKey);
      const builder = (op: xdr.Operation) => new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: NETWORKS[NETWORK].networkPassphrase,
      }).addOperation(op).setTimeout(30).build();

      // Fetch signers
      const signersResult = await server.simulateTransaction(builder(contract.call('get_signers')));
      if (rpc.Api.isSimulationSuccess(signersResult)) {
        setSigners(scValToNative(signersResult.result!.retval).map((s: any) => ({
          address: s.address,
          weight: s.weight,
        })));
      }

      // Fetch threshold
      const thresholdResult = await server.simulateTransaction(builder(contract.call('get_threshold')));
      if (rpc.Api.isSimulationSuccess(thresholdResult)) {
        setThreshold(scValToNative(thresholdResult.result!.retval));
      }

      // Fetch proposals
      const proposalsResult = await server.simulateTransaction(builder(contract.call('get_proposals')));
      if (rpc.Api.isSimulationSuccess(proposalsResult)) {
        setProposals(scValToNative(proposalsResult.result!.retval).map((p: any) => ({
          id: p.id,
          proposer: p.proposer,
          token: p.token,
          recipient: p.recipient,
          amount: p.amount.toString(),
          approvals: p.approvals,
          executed: p.executed,
          createdAt: Number(p.created_at),
        })));
      }
    } catch (error) {
      console.error('Error fetching treasury data:', error);
    }
  }, []);

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
  }, [fetchTransactionHistory]);

  useEffect(() => {
    loadTransactionHistory();
    fetchTreasuryData();
  }, [loadTransactionHistory, fetchTreasuryData]);

  const submitTreasuryTx = async (op: xdr.Operation) => {
    setIsLoading(true);
    try {
      const server = getSorobanServer();
      const { Freighter } = await import("@stellar/freighter-api");
      const publicKey = await Freighter.getPublicKey();
      const account = await server.getAccount(publicKey);

      const transaction = new TransactionBuilder(account, {
        fee: '100000',
        networkPassphrase: NETWORKS[NETWORK].networkPassphrase,
      }).addOperation(op).setTimeout(30).build();

      const simulated = await server.simulateTransaction(transaction);
      if (rpc.Api.isSimulationError(simulated)) {
          throw new Error(`Simulation failed: ${simulated.error}`);
      }

      const prepared = server.prepareTransaction(transaction, simulated);
      const signedXdr = await signTransaction(prepared.toXDR(), NETWORKS[NETWORK].networkPassphrase);
      
      const result = await server.sendTransaction(
        TransactionBuilder.fromXDR(signedXdr, NETWORKS[NETWORK].networkPassphrase)
      );

      if (result.status !== "PENDING") {
          throw new Error(`Transaction failed: ${result.status}`);
      }

      // Wait for confirmation
      for (let i = 0; i < 10; i++) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const status = await server.getTransaction(result.hash);
          if (status.status === "SUCCESS") {
              fetchTreasuryData();
              loadTransactionHistory();
              return status;
          } else if (status.status === "FAILED") {
              throw new Error(`Transaction failed: ${status.resultXdr}`);
          }
      }
      throw new Error("Transaction timed out");
    } finally {
      setIsLoading(false);
    }
  }

  const addSigner = async (address: string, weight: number) => {
    const contract = new Contract(CONTRACTS.treasury!);
    return submitTreasuryTx(contract.call('add_signer', 
      nativeToScVal(Address.fromString(address), { type: 'address' }),
      nativeToScVal(weight, { type: 'u32' })
    ));
  };

  const removeSigner = async (address: string) => {
    const contract = new Contract(CONTRACTS.treasury!);
    return submitTreasuryTx(contract.call('remove_signer', 
      nativeToScVal(Address.fromString(address), { type: 'address' })
    ));
  };

  const updateThreshold = async (newThreshold: number) => {
    const contract = new Contract(CONTRACTS.treasury!);
    return submitTreasuryTx(contract.call('update_threshold', 
      nativeToScVal(newThreshold, { type: 'u32' })
    ));
  };

  const deposit = async (token: string, amount: string) => {
    const contract = new Contract(CONTRACTS.treasury!);
    const { Freighter } = await import("@stellar/freighter-api");
    const publicKey = await Freighter.getPublicKey();
    
    return submitTreasuryTx(contract.call('deposit', 
      nativeToScVal(Address.fromString(token), { type: 'address' }),
      nativeToScVal(Address.fromString(publicKey), { type: 'address' }),
      nativeToScVal(decimalToI128(amount), { type: 'i128' })
    ));
  }

  const createWithdrawal = async (token: string, recipient: string, amount: string) => {
    const contract = new Contract(CONTRACTS.treasury!);
    const { Freighter } = await import("@stellar/freighter-api");
    const publicKey = await Freighter.getPublicKey();

    return submitTreasuryTx(contract.call('create_withdrawal', 
      nativeToScVal(Address.fromString(publicKey), { type: 'address' }),
      nativeToScVal(Address.fromString(token), { type: 'address' }),
      nativeToScVal(Address.fromString(recipient), { type: 'address' }),
      nativeToScVal(decimalToI128(amount), { type: 'i128' })
    ));
  }

  const approveWithdrawal = async (proposalId: number) => {
    const contract = new Contract(CONTRACTS.treasury!);
    const { Freighter } = await import("@stellar/freighter-api");
    const publicKey = await Freighter.getPublicKey();

    return submitTreasuryTx(contract.call('approve_withdrawal', 
      nativeToScVal(Address.fromString(publicKey), { type: 'address' }),
      nativeToScVal(proposalId, { type: 'u32' })
    ));
  }

  return {
    signers,
    threshold,
    proposals,
    isLoading,
    transactionHistory,
    loadTransactionHistory,
    addSigner,
    removeSigner,
    updateThreshold,
    deposit,
    createWithdrawal,
    approveWithdrawal,
  }
}

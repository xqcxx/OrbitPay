import { rpc } from '@stellar/stellar-sdk';

export const NETWORK = {
  name: 'Testnet',
  networkPassphrase: 'Test SDF Network ; September 2015',
  rpcUrl: 'https://soroban-testnet.stellar.org',
  horizonUrl: 'https://horizon-testnet.stellar.org',
} as const;

export const CONTRACTS = {
  treasury: '',
  payrollStream: '',
  vesting: 'CDVEST... (Mock vesting contract ID)', // Update with real ID when deployed
  governance: '',
} as const;

export function getSorobanServer() {
  return new rpc.Server(NETWORK.rpcUrl);
}

import { rpc } from '@stellar/stellar-sdk';

export type StellarNetwork = "testnet" | "mainnet";

export const NETWORKS: Record<StellarNetwork, { name: string; networkPassphrase: string; rpcUrl: string; horizonUrl: string; }> = {
	testnet: {
		name: "Testnet",
		networkPassphrase: "Test SDF Network ; September 2015",
		rpcUrl: "https://soroban-testnet.stellar.org",
		horizonUrl: "https://horizon-testnet.stellar.org",
	},
	mainnet: {
		name: "Mainnet",
		networkPassphrase: "Public Global Stellar Network ; September 2015",
		rpcUrl: "https://soroban-mainnet.stellar.org",
		horizonUrl: "https://horizon.stellar.org",
	}
};

// Deployed Soroban contracts
export const CONTRACTS = {
	treasury: process.env.NEXT_PUBLIC_TREASURY_CONTRACT_ID || "",
	payrollStream: process.env.NEXT_PUBLIC_PAYROLL_CONTRACT_ID || "CB4Z3Q3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3", // Placeholder
	vesting: process.env.NEXT_PUBLIC_VESTING_CONTRACT_ID || "",
	governance: process.env.NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID || "",
} as const;

export const NETWORK: StellarNetwork = (process.env.NEXT_PUBLIC_STELLAR_NETWORK as StellarNetwork) || "testnet";

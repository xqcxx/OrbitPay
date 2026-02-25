/**
 * Stellar/Soroban network configuration.
 * Contributors: see FE-4 for full implementation.
 */

import { Server } from "@stellar/stellar-sdk";

export const NETWORK = {
	name: "Testnet",
	networkPassphrase: "Test SDF Network ; September 2015",
	rpcUrl: "https://soroban-testnet.stellar.org",
	horizonUrl: "https://horizon-testnet.stellar.org",
} as const;

/**
 * Contract IDs — these will be populated after deployment.
 * TODO: Add deployed contract IDs (contributor task FE-4)
 */
export const CONTRACTS = {
	treasury: "",
	payrollStream:
		"CB4Z3Q3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3Z3", // Placeholder - replace with actual deployed contract ID
	vesting: "",
	governance: "",
} as const;

/**
 * Creates a Soroban Server instance for RPC calls.
 */
export function getSorobanServer() {
	return new Server(NETWORK.rpcUrl, {
		allowHttp: true, // For testnet
	});
}

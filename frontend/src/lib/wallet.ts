/**
 * Freighter wallet utilities.
 */

import { NETWORK } from "./network";

/**
 * Check if Freighter wallet extension is installed.
 */
export async function isFreighterInstalled(): Promise<boolean> {
	try {
		const { Freighter } = await import("@stellar/freighter-api");
		return await Freighter.isConnected();
	} catch {
		return false;
	}
}

/**
 * Connect to Freighter and get the user's public key.
 */
export async function connectWallet(): Promise<string | null> {
	try {
		const { Freighter } = await import("@stellar/freighter-api");
		const isConnected = await Freighter.isConnected();

		if (!isConnected) {
			throw new Error("Freighter not connected");
		}

		const publicKey = await Freighter.getPublicKey();
		return publicKey;
	} catch (error) {
		console.error("Error connecting wallet:", error);
		return null;
	}
}

/**
 * Sign a Soroban transaction XDR using Freighter.
 */
export async function signTransaction(
	xdr: string,
	network: string,
): Promise<string> {
	const { Freighter } = await import("@stellar/freighter-api");

	const isConnected = await Freighter.isConnected();
	if (!isConnected) {
		throw new Error("Freighter not connected");
	}

	const signedXdr = await Freighter.signTransaction(xdr, {
		network:
			network === "Test SDF Network ; September 2015" ? "TESTNET" : "PUBLIC",
	});

	return signedXdr;
}

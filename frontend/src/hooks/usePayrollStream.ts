"use client";

import { useState } from "react";
import {
	Contract,
	Address,
	scValToNative,
	nativeToScVal,
	TransactionBuilder,
} from "@stellar/stellar-sdk";
import { CONTRACTS, NETWORK, getSorobanServer } from "@/lib/network";
import { signTransaction } from "@/lib/wallet";

const STROOP_SCALE = 10_000_000n;

interface CreateStreamPayload {
	recipient: string;
	token: string;
	amount: string;
	startTime: number;
	endTime: number;
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

interface Stream {
	id: number;
	sender: string;
	recipient: string;
	token: string;
	totalAmount: number;
	claimedAmount: number;
	startTime: number;
	endTime: number;
	lastClaimTime: number;
	status: "Active" | "Completed" | "Cancelled";
	ratePerSecond: number;
}

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
 */
export function usePayrollStream() {
	const [isLoading, setIsLoading] = useState(false);

	const buildCreateStreamXdr = async ({
		recipient,
		token,
		amount,
		startTime,
		endTime,
	}: CreateStreamPayload): Promise<{ xdr: string; publicKey: string }> => {
		if (!CONTRACTS.payrollStream) {
			throw new Error("Payroll stream contract not deployed");
		}

		const server = getSorobanServer();
		if (!server) {
			throw new Error("Soroban server not configured");
		}

		const { Freighter } = await import("@stellar/freighter-api");
		const publicKey = await Freighter.getPublicKey();

		const contract = new Contract(CONTRACTS.payrollStream);

		const senderAddress = nativeToScVal(Address.fromString(publicKey), {
			type: "address",
		});
		const recipientAddress = nativeToScVal(Address.fromString(recipient), {
			type: "address",
		});
		const tokenAddress = nativeToScVal(Address.fromString(token), {
			type: "address",
		});
		const totalAmount = nativeToScVal(decimalToI128(amount), { type: "i128" });
		const startTimeVal = nativeToScVal(BigInt(startTime), { type: "u64" });
		const endTimeVal = nativeToScVal(BigInt(endTime), { type: "u64" });

		const call = contract.call(
			"create_stream",
			senderAddress,
			recipientAddress,
			tokenAddress,
			totalAmount,
			startTimeVal,
			endTimeVal,
		);

		const account = await server.getAccount(publicKey);
		const transaction = new TransactionBuilder(account, {
			fee: "100000",
			networkPassphrase: NETWORK.networkPassphrase,
		})
			.addOperation(call)
			.setTimeout(30)
			.build();

		const simulated = await server.simulateTransaction(transaction);
		if (simulated.error) {
			throw new Error(`Simulation failed: ${simulated.error}`);
		}

		const assembledTransaction = TransactionBuilder.assembleTransaction(
			transaction,
			simulated,
		);

		return {
			xdr: assembledTransaction.toXDR(),
			publicKey,
		};
	};

	const createStream = async (
		recipient: string,
		token: string,
		amount: string,
		startTime: number,
		endTime: number,
	): Promise<number> => {
		setIsLoading(true);
		try {
			const server = getSorobanServer();
			if (!server) {
				throw new Error("Soroban server not configured");
			}

			const { xdr } = await buildCreateStreamXdr({
				recipient,
				token,
				amount,
				startTime,
				endTime,
			});

			// Sign and submit
			const signedXdr = await signTransaction(xdr, NETWORK.networkPassphrase);

			const result = await server.sendTransaction(
				TransactionBuilder.fromXDR(signedXdr, NETWORK.networkPassphrase),
			);

			if (result.status !== "PENDING") {
				throw new Error(`Transaction failed: ${result.status}`);
			}

			// Wait for confirmation
			let finalResult;
			for (let i = 0; i < 10; i++) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				const status = await server.getTransaction(result.hash);

				if (status.status === "SUCCESS") {
					finalResult = status;
					break;
				} else if (status.status === "FAILED") {
					throw new Error(`Transaction failed: ${status.resultXdr}`);
				}
			}

			if (!finalResult) {
				throw new Error("Transaction timed out");
			}

			// Extract the stream ID from the result
			const returnValue = finalResult.returnValue;
			if (!returnValue) {
				throw new Error("No return value from contract call");
			}

			const streamId = scValToNative(returnValue) as number;
			return streamId;
		} catch (error) {
			console.error("Error creating stream:", error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	const claimFromStream = async (_streamId: number) => {
		// TODO: Implement claim functionality
		throw new Error("Not implemented");
	};

	const cancelStream = async (_streamId: number) => {
		// TODO: Implement cancel functionality
		throw new Error("Not implemented");
	};

	const getClaimable = async (_streamId: number): Promise<number> => {
		// TODO: Implement get claimable amount
		return 0;
	};

	return {
		streams: [] as Stream[],
		isLoading,
		buildCreateStreamXdr,
		createStream,
		claimFromStream,
		cancelStream,
		getClaimable,
	};
}

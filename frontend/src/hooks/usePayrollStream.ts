"use client";

import { useState, useEffect } from "react";
import {
	Contract,
	Address,
	scValToNative,
	nativeToScVal,
	TransactionBuilder,
	rpc,
} from "@stellar/stellar-sdk";
import { CONTRACTS, NETWORK, NETWORKS } from "@/lib/network";
import { getSorobanServer } from "@/lib/soroban";
import { signTransaction } from "@/lib/wallet";

const STROOP_SCALE = 10_000_000n;

interface CreateStreamPayload {
	recipient: string;
	token: string;
	amount: string;
	startTime: number;
	endTime: number;
}

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
			networkPassphrase: NETWORKS[NETWORK].networkPassphrase,
		})
			.addOperation(call)
			.setTimeout(30)
			.build();

		const simulated = await server.simulateTransaction(transaction);
		if (rpc.Api.isSimulationError(simulated)) {
			throw new Error(`Simulation failed: ${simulated.error}`);
		}

		const assembledTransaction = server.prepareTransaction(transaction, simulated);

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
	): Promise<string> => {
		setIsLoading(true);
		try {
			const server = getSorobanServer();

			const { xdr: txXdr } = await buildCreateStreamXdr({
				recipient,
				token,
				amount,
				startTime,
				endTime,
			});

			// Sign and submit
			const signedXdr = await signTransaction(txXdr, NETWORKS[NETWORK].networkPassphrase);

			const result = await server.sendTransaction(
				TransactionBuilder.fromXDR(signedXdr, NETWORKS[NETWORK].networkPassphrase)
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

			const streamId = scValToNative(returnValue).toString();
			return streamId;
		} catch (error) {
			console.error("Error creating stream:", error);
			throw error;
		} finally {
			setIsLoading(false);
		}
	};

	return {
		streams: MOCK_STREAMS,
		isLoading,
		buildCreateStreamXdr,
		createStream,
		claimFromStream: async (_streamId: string) => {},
		cancelStream: async (_streamId: string) => {},
		getClaimable: async (_streamId: string): Promise<number> => 0,
	};
}

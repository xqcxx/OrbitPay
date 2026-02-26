"use client";

import { useState, useEffect, useCallback } from "react";
import {
	Contract,
	Address,
	scValToNative,
	nativeToScVal,
	TransactionBuilder,
	rpc,
    xdr
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
  totalAmount: string
  amountStreamed: string
  ratePerSecond: string
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

/**
 * Hook to interact with the Payroll Stream contract.
 */
export function usePayrollStream() {
	const [isLoading, setIsLoading] = useState(false);
    const [streams, setStreams] = useState<Stream[]>([]);

    const fetchStreams = useCallback(async () => {
        if (!CONTRACTS.payrollStream) return;

        const server = getSorobanServer();
        const contract = new Contract(CONTRACTS.payrollStream);

        try {
            const { Freighter } = await import("@stellar/freighter-api");
            let publicKey: string;
            try {
                publicKey = await Freighter.getPublicKey();
            } catch {
                return;
            }

            const account = await server.getAccount(publicKey);
            const builder = (op: xdr.Operation) => new TransactionBuilder(account, {
                fee: '100',
                networkPassphrase: NETWORKS[NETWORK].networkPassphrase,
            }).addOperation(op).setTimeout(30).build();

            // Fetch streams where user is sender
            const senderResult = await server.simulateTransaction(builder(contract.call('get_streams_by_sender', nativeToScVal(Address.fromString(publicKey), { type: 'address' }))));
            let senderStreams: Stream[] = [];
            if (rpc.Api.isSimulationSuccess(senderResult)) {
                senderStreams = scValToNative(senderResult.result!.retval).map((s: any) => ({
                    id: s.id.toString(),
                    sender: s.sender,
                    recipient: s.recipient,
                    token: s.token,
                    totalAmount: s.total_amount.toString(),
                    amountStreamed: s.amount_streamed.toString(),
                    ratePerSecond: s.rate_per_second.toString(),
                    startTime: Number(s.start_time),
                    endTime: Number(s.end_time),
                    status: s.status as StreamStatus,
                }));
            }

            // Fetch streams where user is recipient
            const recipientResult = await server.simulateTransaction(builder(contract.call('get_streams_by_recipient', nativeToScVal(Address.fromString(publicKey), { type: 'address' }))));
            let recipientStreams: Stream[] = [];
            if (rpc.Api.isSimulationSuccess(recipientResult)) {
                recipientStreams = scValToNative(recipientResult.result!.retval).map((s: any) => ({
                    id: s.id.toString(),
                    sender: s.sender,
                    recipient: s.recipient,
                    token: s.token,
                    totalAmount: s.total_amount.toString(),
                    amountStreamed: s.amount_streamed.toString(),
                    ratePerSecond: s.rate_per_second.toString(),
                    startTime: Number(s.start_time),
                    endTime: Number(s.end_time),
                    status: s.status as StreamStatus,
                }));
            }

            // Merge and de-duplicate
            const allStreams = [...senderStreams, ...recipientStreams];
            const uniqueStreams = allStreams.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            setStreams(uniqueStreams);

        } catch (error) {
            console.error('Error fetching streams:', error);
        }
    }, []);

    useEffect(() => {
        fetchStreams();
    }, [fetchStreams]);

    const submitPayrollTx = async (op: xdr.Operation) => {
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
                    fetchStreams();
                    return status;
                } else if (status.status === "FAILED") {
                    throw new Error(`Transaction failed: ${status.resultXdr}`);
                }
            }
            throw new Error("Transaction timed out");
        } finally {
            setIsLoading(false);
        }
    };

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
                    fetchStreams();
					break;
				} else if (status.status === "FAILED") {
					throw new Error(`Transaction failed: ${status.resultXdr}`);
				}
			}

			if (!finalResult) {
				throw new Error("Transaction timed out");
			}

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

    const claimFromStream = async (streamId: string) => {
        const contract = new Contract(CONTRACTS.payrollStream!);
        const { Freighter } = await import("@stellar/freighter-api");
        const publicKey = await Freighter.getPublicKey();
        
        return submitPayrollTx(contract.call('claim', 
            nativeToScVal(Address.fromString(publicKey), { type: 'address' }),
            nativeToScVal(Number(streamId), { type: 'u32' })
        ));
    };

    const cancelStream = async (streamId: string) => {
        const contract = new Contract(CONTRACTS.payrollStream!);
        const { Freighter } = await import("@stellar/freighter-api");
        const publicKey = await Freighter.getPublicKey();
        
        return submitPayrollTx(contract.call('cancel_stream', 
            nativeToScVal(Address.fromString(publicKey), { type: 'address' }),
            nativeToScVal(Number(streamId), { type: 'u32' })
        ));
    };

    const getClaimable = async (streamId: string): Promise<number> => {
        if (!CONTRACTS.payrollStream) return 0;
        const server = getSorobanServer();
        const contract = new Contract(CONTRACTS.payrollStream);

        try {
            const { Freighter } = await import("@stellar/freighter-api");
            const publicKey = await Freighter.getPublicKey();
            const account = await server.getAccount(publicKey);

            const transaction = new TransactionBuilder(account, {
                fee: '100',
                networkPassphrase: NETWORKS[NETWORK].networkPassphrase,
            }).addOperation(contract.call('get_claimable', nativeToScVal(Number(streamId), { type: 'u32' }))).build();

            const result = await server.simulateTransaction(transaction);
            if (rpc.Api.isSimulationSuccess(result)) {
                const claimable = scValToNative(result.result!.retval);
                return Number(claimable) / Number(STROOP_SCALE);
            }
            return 0;
        } catch (error) {
            console.error('Error getting claimable:', error);
            return 0;
        }
    };

	return {
		streams,
		isLoading,
		buildCreateStreamXdr,
		createStream,
		claimFromStream,
		cancelStream,
		getClaimable,
	};
}

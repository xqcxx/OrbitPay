'use client'

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

export interface VestingSchedule {
    id: string;
    beneficiary: string;
    grantor: string;
    token: string;
    totalAmount: string;
    claimedAmount: string;
    startTime: number;
    cliffDuration: number;
    totalDuration: number;
    revocable: boolean;
    revoked: boolean;
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
 * Hook to interact with the Vesting contract.
 */
export function useVesting() {
    const [isLoading, setIsLoading] = useState(false);
    const [schedules, setSchedules] = useState<VestingSchedule[]>([]);

    const fetchSchedules = useCallback(async () => {
        if (!CONTRACTS.vesting) return;

        const server = getSorobanServer();
        const contract = new Contract(CONTRACTS.vesting);

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

            // Fetch schedules where user is beneficiary
            const beneficiaryResult = await server.simulateTransaction(builder(contract.call('get_schedules_by_beneficiary', nativeToScVal(Address.fromString(publicKey), { type: 'address' }))));
            let beneficiarySchedules: VestingSchedule[] = [];
            if (rpc.Api.isSimulationSuccess(beneficiaryResult)) {
                beneficiarySchedules = scValToNative(beneficiaryResult.result!.retval).map((s: any) => ({
                    id: s.id.toString(),
                    beneficiary: s.beneficiary,
                    grantor: s.grantor,
                    token: s.token,
                    totalAmount: s.total_amount.toString(),
                    claimedAmount: s.claimed_amount.toString(),
                    startTime: Number(s.start_time),
                    cliffDuration: Number(s.cliff_duration),
                    totalDuration: Number(s.total_duration),
                    revocable: s.revocable,
                    revoked: s.revoked,
                }));
            }

            // Fetch schedules where user is grantor
            const grantorResult = await server.simulateTransaction(builder(contract.call('get_schedules_by_grantor', nativeToScVal(Address.fromString(publicKey), { type: 'address' }))));
            let grantorSchedules: VestingSchedule[] = [];
            if (rpc.Api.isSimulationSuccess(grantorResult)) {
                grantorSchedules = scValToNative(grantorResult.result!.retval).map((s: any) => ({
                    id: s.id.toString(),
                    beneficiary: s.beneficiary,
                    grantor: s.grantor,
                    token: s.token,
                    totalAmount: s.total_amount.toString(),
                    claimedAmount: s.claimed_amount.toString(),
                    startTime: Number(s.start_time),
                    cliffDuration: Number(s.cliff_duration),
                    totalDuration: Number(s.total_duration),
                    revocable: s.revocable,
                    revoked: s.revoked,
                }));
            }

            const allSchedules = [...beneficiarySchedules, ...grantorSchedules];
            const uniqueSchedules = allSchedules.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            setSchedules(uniqueSchedules);

        } catch (error) {
            console.error('Error fetching vesting schedules:', error);
        }
    }, []);

    useEffect(() => {
        fetchSchedules();
    }, [fetchSchedules]);

    const submitVestingTx = async (op: xdr.Operation) => {
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

            for (let i = 0; i < 10; i++) {
                await new Promise((resolve) => setTimeout(resolve, 1000));
                const status = await server.getTransaction(result.hash);
                if (status.status === "SUCCESS") {
                    fetchSchedules();
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

    const createSchedule = async (
        beneficiary: string,
        token: string,
        amount: string,
        startTime: number,
        cliffDuration: number,
        totalDuration: number,
        revocable: boolean
    ) => {
        const contract = new Contract(CONTRACTS.vesting!);
        return submitVestingTx(contract.call('create_schedule',
            nativeToScVal(Address.fromString(beneficiary), { type: 'address' }),
            nativeToScVal(Address.fromString(token), { type: 'address' }),
            nativeToScVal(decimalToI128(amount), { type: 'i128' }),
            nativeToScVal(BigInt(startTime), { type: 'u64' }),
            nativeToScVal(BigInt(cliffDuration), { type: 'u64' }),
            nativeToScVal(BigInt(totalDuration), { type: 'u64' }),
            nativeToScVal(revocable, { type: 'bool' })
        ));
    };

    const claimFromSchedule = async (scheduleId: string) => {
        const contract = new Contract(CONTRACTS.vesting!);
        const { Freighter } = await import("@stellar/freighter-api");
        const publicKey = await Freighter.getPublicKey();
        
        return submitVestingTx(contract.call('claim', 
            nativeToScVal(Address.fromString(publicKey), { type: 'address' }),
            nativeToScVal(Number(scheduleId), { type: 'u32' })
        ));
    };

    const revokeSchedule = async (scheduleId: string) => {
        const contract = new Contract(CONTRACTS.vesting!);
        return submitVestingTx(contract.call('revoke', 
            nativeToScVal(Number(scheduleId), { type: 'u32' })
        ));
    };

    const getProgress = async (scheduleId: string): Promise<any> => {
        if (!CONTRACTS.vesting) return null;
        const server = getSorobanServer();
        const contract = new Contract(CONTRACTS.vesting);

        try {
            const { Freighter } = await import("@stellar/freighter-api");
            const publicKey = await Freighter.getPublicKey();
            const account = await server.getAccount(publicKey);

            const transaction = new TransactionBuilder(account, {
                fee: '100',
                networkPassphrase: NETWORKS[NETWORK].networkPassphrase,
            }).addOperation(contract.call('get_progress', nativeToScVal(Number(scheduleId), { type: 'u32' }))).build();

            const result = await server.simulateTransaction(transaction);
            if (rpc.Api.isSimulationSuccess(result)) {
                return scValToNative(result.result!.retval);
            }
            return null;
        } catch (error) {
            console.error('Error getting progress:', error);
            return null;
        }
    };

    return {
        schedules,
        isLoading,
        createSchedule,
        claimFromSchedule,
        revokeSchedule,
        getProgress,
    };
}

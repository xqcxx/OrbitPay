import { rpc, Contract, TransactionBuilder, xdr, Transaction } from '@stellar/stellar-sdk';
import { NETWORKS, StellarNetwork } from './network';

/**
 * Returns an instance of the Soroban Server for the specified network.
 */
export function getSorobanServer(network: StellarNetwork = "testnet"): rpc.Server {
	const config = NETWORKS[network];
	return new rpc.Server(config.rpcUrl, {
		allowHttp: network === "testnet",
	});
}

/**
 * Helper to build and simulate a Soroban transaction for a contract invocation.
 */
export async function buildTransaction(
	server: rpc.Server,
	network: StellarNetwork,
	sourceAddress: string,
	contractId: string,
	methodName: string,
	args: xdr.ScVal[] = []
): Promise<Transaction> {
	const account = await server.getAccount(sourceAddress);
	const contract = new Contract(contractId);
	const networkPassphrase = NETWORKS[network].networkPassphrase;

	const txBuilder = new TransactionBuilder(account, {
		fee: "100", // Initial base fee
		networkPassphrase,
	});

	const operation = contract.call(methodName, ...args);
	txBuilder.addOperation(operation).setTimeout(30);

	let tx = txBuilder.build();
	
	// Simulate the transaction to get the footprint and resource limits
	const simulation = await server.simulateTransaction(tx);
	
	if (rpc.Api.isSimulationSuccess(simulation)) {
		tx = server.prepareTransaction(tx, simulation);
	} else {
		throw new Error(`Simulation failed: ${JSON.stringify(simulation)}`);
	}
	
	return tx;
}

/**
 * Helper to submit a signed transaction XDR to the Soroban RPC.
 */
export async function submitTransaction(
	server: rpc.Server,
	network: StellarNetwork,
	signedXdr: string
): Promise<rpc.Api.GetTransactionResponse> {
	try {
        const networkPassphrase = NETWORKS[network].networkPassphrase;
        const tx = TransactionBuilder.fromXDR(signedXdr, networkPassphrase) as Transaction;
		const sendResponse = await server.sendTransaction(tx);
        
        if (sendResponse.status !== "PENDING") {
            throw new Error(`Transaction submission failed: ${sendResponse.status}`);
        }

        const txHash = sendResponse.hash;
        let attempts = 0;
        let response;
        
        while (attempts < 12) { // Poll for up to 12 seconds
            response = await server.getTransaction(txHash);
            if (response.status === "SUCCESS" || response.status === "FAILED") {
                return response as rpc.Api.GetTransactionResponse;
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
            attempts++;
        }
        
        throw new Error("Transaction timed out while polling for status");
	} catch (error) {
		console.error("Failed to submit transaction to Soroban:", error);
		throw error;
	}
}

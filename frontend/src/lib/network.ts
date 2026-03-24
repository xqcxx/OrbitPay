import { Server, assembleTransaction } from "@stellar/stellar-sdk/rpc";
import {
  TransactionBuilder,
  BASE_FEE,
  Networks,
  Address,
  nativeToScVal,
  xdr,
  Contract,
} from "@stellar/stellar-sdk";
import type { Api } from "@stellar/stellar-sdk/rpc";

export type NetworkType = "testnet" | "mainnet";

export interface NetworkConfig {
  name: string;
  networkPassphrase: string;
  rpcUrl: string;
  horizonUrl: string;
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  testnet: {
    name: "Testnet",
    networkPassphrase: Networks.TESTNET,
    rpcUrl: "https://soroban-testnet.stellar.org",
    horizonUrl: "https://horizon-testnet.stellar.org",
  },
  mainnet: {
    name: "Mainnet",
    networkPassphrase: Networks.PUBLIC,
    rpcUrl: "https://soroban-mainnet.stellar.org",
    horizonUrl: "https://horizon.stellar.org",
  },
};

let currentNetwork: NetworkType = "testnet";

export function getCurrentNetwork(): NetworkType {
  return currentNetwork;
}

export function setCurrentNetwork(network: NetworkType): void {
  currentNetwork = network;
}

export function getNetworkConfig(): NetworkConfig {
  return NETWORK_CONFIGS[currentNetwork];
}

export const NETWORK = NETWORK_CONFIGS.testnet;

export const CONTRACTS = {
  treasury: "",
  payrollStream: "",
  vesting: "",
  governance: "",
} as const;

let sorobanServerInstance: Server | null = null;

export function getSorobanServer(): Server {
  const config = getNetworkConfig();
  if (!sorobanServerInstance || sorobanServerInstance.serverURL.toString() !== config.rpcUrl) {
    sorobanServerInstance = new Server(config.rpcUrl, {
      allowHttp: config.rpcUrl.startsWith("http://"),
    });
  }
  return sorobanServerInstance;
}

export interface BuildTransactionParams {
  contractId: string;
  method: string;
  args: xdr.ScVal[];
  publicKey: string;
  fee?: string;
  timeout?: number;
}

function isSimulationError(sim: Api.SimulateTransactionResponse): sim is Api.SimulateTransactionFailureResponse {
  return "error" in sim && sim.error !== undefined;
}

export async function buildTransaction({
  contractId,
  method,
  args,
  publicKey,
  fee = BASE_FEE,
  timeout = 30,
}: BuildTransactionParams): Promise<{ xdr: string; publicKey: string }> {
  const server = getSorobanServer();
  const config = getNetworkConfig();

  const account = await server.getAccount(publicKey);
  const contract = new Contract(contractId);
  const call = contract.call(method, ...args);

  const transaction = new TransactionBuilder(account, {
    fee,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(call)
    .setTimeout(timeout)
    .build();

  const simulated = await server.simulateTransaction(transaction);
  if (isSimulationError(simulated)) {
    throw new Error(`Simulation failed: ${simulated.error}`);
  }

  const assembledTransaction = assembleTransaction(transaction, simulated);

  return {
    xdr: assembledTransaction.build().toXDR(),
    publicKey,
  };
}

export interface SubmitTransactionResult {
  hash: string;
  status: string;
  result?: xdr.ScVal;
}

export async function submitTransaction(
  signedXdr: string,
  waitForConfirmation: boolean = true,
  maxRetries: number = 10
): Promise<SubmitTransactionResult> {
  const server = getSorobanServer();
  const config = getNetworkConfig();

  const transaction = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);

  const result = await server.sendTransaction(transaction);

  if (result.status === "ERROR") {
    throw new Error(`Transaction submission failed: ${result.errorResult?.toString() || "Unknown error"}`);
  }

  if (!waitForConfirmation) {
    return { hash: result.hash, status: result.status };
  }

  for (let i = 0; i < maxRetries; i++) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const status = await server.getTransaction(result.hash);

    switch (status.status) {
      case "SUCCESS":
        return { hash: result.hash, status: "SUCCESS", result: status.returnValue };
      case "FAILED":
        throw new Error(`Transaction failed: ${status.resultXdr}`);
      case "NOT_FOUND":
        continue;
    }
  }

  throw new Error("Transaction confirmation timed out");
}

export function addressToScVal(address: string): xdr.ScVal {
  return nativeToScVal(Address.fromString(address), { type: "address" });
}

export function i128ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "i128" });
}

export function u64ToScVal(value: bigint): xdr.ScVal {
  return nativeToScVal(value, { type: "u64" });
}

export function stringToScVal(value: string): xdr.ScVal {
  return nativeToScVal(value, { type: "string" });
}

export function boolToScVal(value: boolean): xdr.ScVal {
  return nativeToScVal(value, { type: "bool" });
}

export function getExplorerUrl(txHash: string): string {
  const baseUrl = currentNetwork === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
  return `${baseUrl}/tx/${txHash}`;
}

export function getContractExplorerUrl(contractId: string): string {
  const baseUrl = currentNetwork === "mainnet"
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
  return `${baseUrl}/contract/${contractId}`;
}

import {
  isConnected,
  getPublicKey,
  signTransaction as freighterSign,
} from '@stellar/freighter-api';

export async function isFreighterInstalled(): Promise<boolean> {
  return isConnected();
}

export async function connectWallet(): Promise<string | null> {
  try {
    const publicKey = await getPublicKey();
    return publicKey;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    return null;
  }
}

export async function signTransaction(xdr: string, network: string): Promise<string> {
  try {
    const signedXdr = await freighterSign(xdr, {
      network,
    });
    return signedXdr;
  } catch (error) {
    console.error('Failed to sign transaction:', error);
    throw error;
  }
}

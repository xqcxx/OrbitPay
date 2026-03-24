import * as StellarSdk from '@stellar/stellar-sdk';

export class OrbitPayClient {
  private server: StellarSdk.horizon.Server;

  constructor(serverUrl: string = 'https://horizon-testnet.stellar.org') {
    this.server = new StellarSdk.horizon.Server(serverUrl);
  }

  public getServer(): StellarSdk.horizon.Server {
    return this.server;
  }
}

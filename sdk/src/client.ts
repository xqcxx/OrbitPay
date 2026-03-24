import * as StellarSdk from '@stellar/stellar-sdk';

export class OrbitPayClient {
  private server: StellarSdk.Horizon.Server;

  constructor(serverUrl: string = 'https://horizon-testnet.stellar.org') {
    this.server = new StellarSdk.Horizon.Server(serverUrl);
  }

  public getServer(): StellarSdk.Horizon.Server {
    return this.server;
  }
}

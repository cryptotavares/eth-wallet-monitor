import Web3 from 'web3';

export default class Web3Client {
  public web3Http: Web3;

  public web3Websocket: Web3;

  constructor(
    httpProvider: string,
    wssProvider: string,
  ) {
    this.web3Http = new Web3(new Web3.providers.HttpProvider(httpProvider));
    this.web3Websocket = new Web3(new Web3.providers.WebsocketProvider(wssProvider));
  }
}

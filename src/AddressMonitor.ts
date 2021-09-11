import { Log, Transaction } from 'web3-core';
import { Subscription } from 'web3-core-subscriptions';
import Web3Client from './Web3Client';

type AddressMonitorOptions = {
  addressesToMonitor: string[],
  monitorType: 'wallet' | 'smartContract',
  httpProvider: string,
  wssProvider: string,
  smartContractTopics?: string[]
};

export default class AddressMonitor extends Web3Client {
  subscriptionId: string | undefined;

  protected subscription: Subscription<Log | string> | null = null;

  protected addressesToMonitor: string[] = [];

  protected monitorType: 'wallet' | 'smartContract';

  protected smartContractTopics: string[] | null[] = [null];

  constructor({
    addressesToMonitor,
    monitorType,
    httpProvider,
    wssProvider,
    smartContractTopics,
  }: AddressMonitorOptions) {
    super(httpProvider, wssProvider);

    this.addressesToMonitor = addressesToMonitor.map((address) => address.toLocaleLowerCase());
    this.monitorType = monitorType;

    if (smartContractTopics) {
      this.smartContractTopics = smartContractTopics;
    }
  }

  private initSmartContractSubscription(): Subscription<Log> {
    const topics = this.smartContractTopics;
    return this.web3Websocket.eth.subscribe(
      'logs',
      {
        address: this.addressesToMonitor,
        topics,
      },
    );
  }

  private initWalletSubscription(): Subscription<string> {
    return this.web3Websocket.eth.subscribe('pendingTransactions');
  }

  private initSubscription(): Subscription<Log | string> {
    switch (this.monitorType) {
      case 'wallet': {
        return this.initWalletSubscription();
      }
      case 'smartContract': {
        return this.initSmartContractSubscription();
      }
      default: throw new Error('Monitor type not indentified');
    }
  }

  registerListeners(
    dataCb: (error: Error | null, trx?: Transaction) => void,
  ): void {
    if (this.subscription) {
      return;
    }

    this.subscription = this.initSubscription();

    this.subscription
      .on('connected', (subscriptionId) => {
        this.subscriptionId = subscriptionId;
      })
      .on('data', (data) => {
        const transactionHash = typeof data === 'string' ? data : data.transactionHash;

        this.web3Http.eth.getTransaction(transactionHash)
          .then((trx) => {
            if (!trx) {
              return;
            }

            const isMonitorAddressTrx = this.addressesToMonitor.find(
              (address) => [
                trx.from.toLocaleLowerCase(),
                trx.to?.toLocaleLowerCase(),
              ].includes(address),
            );

            if (!isMonitorAddressTrx) {
              return;
            }

            dataCb(null, trx);
          })
          .catch((error: Error) => dataCb(error));
      })
      .on('error', (error) => {
        dataCb(error);
      });
  }

  async removeSubscription(): Promise<void> {
    if (!this.subscription) {
      return;
    }

    const unsubscribed = await this.subscription.unsubscribe();

    if (!unsubscribed) {
      throw new Error('Failed to unsubscribe');
    }
  }
}

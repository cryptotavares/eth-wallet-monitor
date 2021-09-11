/* eslint-disable max-classes-per-file */
import { PassThrough } from 'stream';
import AddressMonitor from '../src/AddressMonitor';

const sleep = (
  milisecond: number,
):Promise<void> => new Promise((resolve) => setTimeout(resolve, milisecond));

const fakeHttpClient = jest.fn();
const fakeWebSocketClient = jest.fn();

jest.mock('../src/Web3Client', () => ({
  __esModule: true,
  default: class {
    public web3Http: any;

    public web3Websocket: any;

    constructor() {
      this.web3Http = {
        eth: {
          getTransaction: fakeHttpClient,
        },
      };
      this.web3Websocket = {
        eth: { subscribe: fakeWebSocketClient },
      };
    }
  },
}));

describe('AddressMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Wallet monitor type', () => {
    test('Successfully initialize monitoring', () => {
      expect.assertions(5);

      const subscriptionId = 'fakeSubscriptionId';

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'wallet',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);

      fakeEventStream.destroy();

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('pendingTransactions');
      expect(fakeHttpClient).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Successfully fetch a pending transaction', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeTransaction = {
        from: 'fromAddress',
        to: 'fakeAddress',
      };

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise((resolve) => resolve(fakeTransaction)),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'wallet',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', 'fakeTrxHash');

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('pendingTransactions');
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, fakeTransaction);
    });

    test('Successfully Fetches a pending transaction but does not pass it to the callback if the addresses from the trx are not being monitored', async () => {
      expect.assertions(5);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeTransaction = {
        from: 'fromAddress',
        to: 'toAddress',
      };

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise((resolve) => resolve(fakeTransaction)),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['test'],
        monitorType: 'wallet',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', 'fakeTrxHash');

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('pendingTransactions');
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });

    test('Fetch a pending transaction that returns undefined', async () => {
      expect.assertions(5);

      const subscriptionId = 'fakeSubscriptionId';

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise<void>((resolve) => resolve()),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'wallet',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', 'fakeTrxHash');

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('pendingTransactions');
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });

    test('Fails to fetch a pending transaction', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeError = new Error('Failed to fetch pending transaction');

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise((_resolve, reject) => reject(fakeError)),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'wallet',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', 'fakeTrxHash');

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('pendingTransactions');
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(fakeError);
    });

    test('Monitoring subscription emits an error', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeError = new Error('Failed to fetch pending transaction');

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'wallet',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('error', fakeError);

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('pendingTransactions');
      expect(fakeHttpClient).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(fakeError);
    });
  });

  describe('Smart contract monitor type', () => {
    test('Successfully initialize monitoring', () => {
      expect.assertions(5);

      const subscriptionId = 'fakeSubscriptionId';

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);

      fakeEventStream.destroy();

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['fakeaddress'], topics: [null] });
      expect(fakeHttpClient).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();
    });

    test('Successfully fetch a pending transaction', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeTransaction = {
        from: 'fromAddress',
        to: 'fakeAddress',
      };

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise((resolve) => resolve(fakeTransaction)),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
        smartContractTopics: ['whatagreattopic'],
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', { transactionHash: 'fakeTrxHash' });

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith(
        'logs',
        { address: ['fakeaddress'], topics: ['whatagreattopic'] },
      );
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(null, fakeTransaction);
    });

    test('Successfully Fetches a pending transaction but does not pass it to the callback if the addresses from the trx are not being monitored', async () => {
      expect.assertions(5);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeTransaction = {
        from: 'fromAddress',
        to: 'toAddress',
      };

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise((resolve) => resolve(fakeTransaction)),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['anotherAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', { transactionHash: 'fakeTrxHash' });

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['anotheraddress'], topics: [null] });
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).not.toHaveBeenCalled();
    });

    test('Fails to fetch a pending transaction', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeError = new Error('Failed to fetch pending transaction');

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);
      fakeHttpClient.mockImplementation(
        () => new Promise((_resolve, reject) => reject(fakeError)),
      );

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('data', { transactionHash: 'fakeTrxHash' });

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['fakeaddress'], topics: [null] });
      expect(fakeHttpClient).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(fakeError);
    });

    test('Monitoring subscription emits an error', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';
      const fakeError = new Error('Failed to fetch transaction that generated received log');

      const fakeEventStream = new PassThrough() as any;
      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.emit('error', fakeError);

      fakeEventStream.destroy();

      await sleep(10);

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['fakeaddress'], topics: [null] });
      expect(fakeHttpClient).not.toHaveBeenCalled();
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(fakeError);
    });
  });

  test('Fails to initialize a subscription when monitor type is not wallet or smartContract', () => {
    expect.assertions(1);

    try {
      // eslint-disable-next-line no-new
      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'nonMonitorType' as any,
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fail();
    } catch (error) {
      expect(error).toEqual(new Error('Monitor type not indentified'));
    }
  });

  test('Can only register one subscription per AddressMonitor instance', () => {
    expect.assertions(6);

    const subscriptionId = 'fakeSubscriptionId';

    const fakeEventStream = new PassThrough() as any;
    fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

    const MonitorClient = new AddressMonitor({
      addressesToMonitor: ['fakeAddress'],
      monitorType: 'smartContract',
      httpProvider: 'https://fakeProvider',
      wssProvider: 'wss://fakeProvider',
    });

    const callback = jest.fn();

    MonitorClient.registerListeners(callback);

    fakeEventStream.emit('connected', subscriptionId);
    fakeEventStream.destroy();

    expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
    expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
    expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['fakeaddress'], topics: [null] });
    expect(fakeHttpClient).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();

    MonitorClient.registerListeners(callback);

    expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
  });

  describe('removeSubscription', () => {
    class ExtendedPassTrough extends PassThrough {
      // eslint-disable-next-line class-methods-use-this
      unsubscribe() { return jest.fn(); }
    }

    test('Successfully removes a subscription', async () => {
      expect.assertions(6);

      const subscriptionId = 'fakeSubscriptionId';

      const unsubscribeStub = jest.fn().mockResolvedValue(true);
      ExtendedPassTrough.prototype.unsubscribe = unsubscribeStub;
      const fakeEventStream = new ExtendedPassTrough() as any;

      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.destroy();

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['fakeaddress'], topics: [null] });
      expect(fakeHttpClient).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();

      await MonitorClient.removeSubscription();

      expect(unsubscribeStub).toHaveBeenCalledTimes(1);
    });

    test('Throws an error when unsubscribe is falsy', async () => {
      expect.assertions(7);

      const subscriptionId = 'fakeSubscriptionId';

      const unsubscribeStub = jest.fn().mockResolvedValue(false);
      ExtendedPassTrough.prototype.unsubscribe = unsubscribeStub;
      const fakeEventStream = new ExtendedPassTrough() as any;

      fakeWebSocketClient.mockReturnValueOnce(fakeEventStream);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      const callback = jest.fn();

      MonitorClient.registerListeners(callback);

      fakeEventStream.emit('connected', subscriptionId);
      fakeEventStream.destroy();

      expect(MonitorClient.subscriptionId).toEqual(subscriptionId);
      expect(fakeWebSocketClient).toHaveBeenCalledTimes(1);
      expect(fakeWebSocketClient).toHaveBeenCalledWith('logs', { address: ['fakeaddress'], topics: [null] });
      expect(fakeHttpClient).not.toHaveBeenCalled();
      expect(callback).not.toHaveBeenCalled();

      try {
        await MonitorClient.removeSubscription();
        fail();
      } catch (error) {
        expect(unsubscribeStub).toHaveBeenCalledTimes(1);
        expect(error).toEqual(new Error('Failed to unsubscribe'));
      }
    });

    test('Does nothing if there is no subscription', async () => {
      expect.assertions(2);

      const MonitorClient = new AddressMonitor({
        addressesToMonitor: ['fakeAddress'],
        monitorType: 'smartContract',
        httpProvider: 'https://fakeProvider',
        wssProvider: 'wss://fakeProvider',
      });

      await MonitorClient.removeSubscription();

      expect(fakeWebSocketClient).not.toHaveBeenCalled();
      expect(fakeHttpClient).not.toHaveBeenCalled();
    });
  });
});

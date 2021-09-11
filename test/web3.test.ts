import Web3 from 'web3';
import Web3Client from '../src/Web3Client';

describe('Web3Client', () => {
  test('successfully returns both http and wss clients', () => {
    const client = new Web3Client(
      'https://fakeHttpProvider',
      'wss://fakeWssProvider',
    );

    expect(client.web3Websocket).toBeInstanceOf(Web3);
    expect(client.web3Http).toBeInstanceOf(Web3);
  });

  test('throws when providers are not valid', () => {
    try {
      // eslint-disable-next-line no-new
      new Web3Client('fakeHttpProvider', 'fakeWssProvider');

      fail();
    } catch (error: any) {
      expect(error.message).toEqual('Invalid URL: fakeWssProvider');
      expect(error.code).toEqual('ERR_INVALID_URL');
    }
  });
});

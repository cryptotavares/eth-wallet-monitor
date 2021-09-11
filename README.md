# eth-wallet-monitor
An abstraction on top of [web3.js](https://github.com/ChainSafe/web3.js) that allows anyone to subscribe to ethereum wallets events (be it a smart contract or an personal wallet).

Depending on the type of wallet being monitored, different events are subscribed:
* `pendingTransactions` - if the wallet is a personal address then the subscritpion is to all pending transactions and cross reference the trx `to` and `from` with the addresses being monitored.

* `logs` - if the address is a smart contract, then the subscription is to all logs emited by that contract. In this case it is also possible to fine tune the log events by the intended topics.

# Instalation
```sh
npm install eth-wallet-monitor
```
# Usage
Instantiate an address monitor and then register the listeners. This will hook a subscription to either `logs` or `pendingTransactions` events.

Whenever one of those events is received, the corresponding transaction is fetched and passed to the callback specified when registering the listeners.

```ts
  const EthAddressMonitor = new AddressMonitor(
    {
      addressesToMonitor, // list of addresses that we want to monitor
      monitorType, // type of addresses that we want to monitor
      httpProvider, // ethereum node http provider
      wssProvider, // ethereum node webSocket provider
    },
  );

  const callback = (...args) => {...}

  EthAddressMonitor.registerListeners(callback);
```
# Building
## Requirements
* node 14

We recommend using nvm to manage your node versions. Once nvm is installed, take adavantage of `.nvmrc` to load the correct node version.

```sh
nvm use
```
## Development
In order to start developing:

```shell
git clone git@github.com:cryptotavares/eth-wallet-address.git
npm install
npm test
npm run eslint
npm run coverage
```

This will clone this repo, install the dependencies, run the tests, eslint and coverage reports.

You can find the coverage report under `coverage/lcov-report/index.html` after running the coverage task.




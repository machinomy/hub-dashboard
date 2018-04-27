# Hub Dashboard [![Build Status](https://travis-ci.com/machinomy/hub-dashboard.svg?token=K1HKiXykkAKA6zQXxNvq&branch=master)](https://travis-ci.com/machinomy/hub-dashboard)
Mission control for Machinomy Hub

## Get started

 Copy example.env to .env and setup its parameters.

 Ensure PostgreSQL' database (default - 'PaymentHub') and user (default user - 'paymenthub' with password '1') are exists in DBMS.
 
 You can use only PostgreSQL as engine at the moment. Please, use **only yarn**, **not npm**.
 
 Apply migrations (need only once per database)
 ```
 yarn migrate
 ```
 And do
```
1. yarn install --pure-lockfile
2. yarn build
3. yarn start
```
or 
```
3. yarn start-inspect 
```
for Node.js-debugging in Chrome

## Settings file (.env file)

Default .env file:

```
WALLET_ADDRESS=0x363dfeAfB265A1e98403A7613A3325Ec00FaF222
ETH_RPC_URL=http://127.0.0.1:8545
PORT=5005
DATABASE_URL=postgresql://paymenthub:1@localhost/PaymentHub
REDIS_URL=redis://127.0.0.1:6379
```
WALLET_ADDRESS - 0x-prefixed Ethereum-address

ETH_RPC_URL - URL of Ethereum RPC (you can use local Ganache, 
but ensure you correctly deployed machinomy-contracts, see instructions below)

PORT - listening port for dashboard's website and API

DATABASE_URL - connection URL for the main database. postgresql:// prefix **is mandatory**. 

REDIS_URL - connection string for REDIS. redis:// prefix **is mandatory**.

## Working with local Ethereum RPC (via Ganache)

1. Clone Machinomy and Machinomy-Contracts to local filesystem 
```
git clone git@github.com:machinomy/machinomy.git
git clone git@github.com:machinomy/machinomy-contracts.git
```
2. Change directory to machinomy-contracts and do yarn link, compile and deploy contracts.
```
yarn link
yarn truffle:compile
yarn truffle:migrate --reset
yarn prepublish
``` 
3. Change directory to machinomy and do yarn link, yarn link @machinomy/contracts
```
yarn link
yarn link @machinomy/contracts
yarn migrate
yarn prepublish
```
4. Change directory to hub-dashboard and do yarn link machinomy
```
yarn link machinomy
```
5. Rebuild hub-dashboard
```
yarn build
```
6. Ensure that @machinomy/contracts are available - open this file
```
hub-dashboard/node_modules/machinomy/node_modules/@machinomy/contracts/dist/build/contracts/Unidirectional.json
```
Search for 'networks' (the only occur will be at very end of file) and check available network IDs.
Network ID from Ganache must be in the list and value of its key 'address' must match address of Unidirectional contract ( address of Unidirectional appears in terminal when you deployed @machinomy/contracts via yarn truffle:migrate --reset)
 
## Requirements

Node.js 9+

yarnpkg 1.6+

PostgreSQL 9+


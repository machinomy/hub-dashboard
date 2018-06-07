import Machinomy from 'machinomy'
import PaymentHub from './PaymentHub'
import { Registry } from './Container'
import DBEngine from './DBEngine'
import { Client } from 'pg'
import TipsDao, { PostgresTipsDao } from './dao/TipsDao'
import { PaymentHandlerImpl } from './PaymentHandler'
import HDWalletProvider from '@machinomy/hdwallet-provider'

require('dotenv').config()

const registry = new Registry()
registry.bind('TipsDao', (engine: DBEngine<Client>, machinomy: Machinomy) => new PostgresTipsDao(engine, machinomy), ['DBEngine', 'Machinomy'])
registry.bind('PaymentHandler', (tipsDao: TipsDao) => new PaymentHandlerImpl(tipsDao), ['TipsDao'])

const WHITELIST_DOMAINS = process.env.WHITELIST_DOMAINS ? String(process.env.WHITELIST_DOMAINS) : ''
const whitelist = WHITELIST_DOMAINS.split(',')

const ETH_RPC_URL = process.env.ETH_RPC_URL as string
const MNEMONIC = process.env.MNEMONIC as string
const provider = new HDWalletProvider(MNEMONIC, ETH_RPC_URL)

const hub = new PaymentHub({
  provider: provider,
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  authRealm: 'Machinomy',
  sessionSecret: 'Zx8Vc9SZfPjOLp6pTw60J4Ppda3MWU23PqO3nWYh2tBamQPLYuKdFsTsBdJZIvN',
  port: parseInt(process.env.PORT!, 10),
  authDomainWhitelist: [
    'localhost',
    ...whitelist
  ],
  recipientAddress: process.env.WALLET_ADDRESS!,
  hotWalletAddress: process.env.WALLET_ADDRESS!,
  adminAddresses: [
    process.env.WALLET_ADDRESS!.toLowerCase()
  ],
  registry,
  branding: {
    title: 'Machinomy Hub Dashboard',
    companyName: 'Machinomy',
    username: '',
    backgroundColor: '#ff3b81',
    textColor: '#fff'
  },
  staleChannelDays: 7
})

async function run () {
  if (process.argv[2] === 'closeSettlingChannels') {
    await hub.closeSettlingChannels()
    process.exit(0)
  } else {
    await hub.start()
  }
}

run().catch(console.error.bind(console))

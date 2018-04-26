import Machinomy from 'machinomy'
import PaymentHub from './PaymentHub'
import { Registry } from './Container'
import DBEngine from './DBEngine'
import { Client } from 'pg'
import TipsDao, { PostgresTipsDao } from './dao/TipsDao'
import { PaymentHandlerImpl } from './PaymentHandler'

require('dotenv').config()

const registry = new Registry()
registry.bind('TipsDao', (engine: DBEngine<Client>, machinomy: Machinomy) => new PostgresTipsDao(engine, machinomy), ['DBEngine', 'Machinomy'])
registry.bind('PaymentHandler', (tipsDao: TipsDao) => new PaymentHandlerImpl(tipsDao), ['TipsDao'])

const hub = new PaymentHub({
  ethRpcUrl: process.env.ETH_RPC_URL!,
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  authRealm: 'Machinomy',
  sessionSecret: 'Zx8Vc9SZfPjOLp6pTw60J4Ppda3MWU23PqO3nWYh2tBamQPLYuKdFsTsBdJZIvN',
  port: parseInt(process.env.PORT!, 10),
  authDomainWhitelist: [
    'localhost'
  ],
  recipientAddress: process.env.WALLET_ADDRESS!,
  hotWalletAddress: process.env.WALLET_ADDRESS!,
  adminAddresses: [
    process.env.WALLET_ADDRESS!
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

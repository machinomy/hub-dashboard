import Machinomy from 'machinomy'
import { Registry } from './Container'
import AuthApiService from './api/AuthApiService'
import CRAuthManager, { MemoryCRAuthManager } from './CRAuthManager'
import Config from './Config'
import { ApiService } from './api/ApiService'
import BrandingApiService from './api/BrandingApiService'
import { default as DBEngine, PostgresDBEngine } from './DBEngine'
import { Store } from 'express-session'
import { PaymentHandler } from './PaymentHandler'
import PaymentsApiService from './api/PaymentsApiService'
import ChannelWatcher from './ChannelWatcher'
import { AdminApiService } from './api/admin/AdminApiService'
import ChannelsApiService from './api/ChannelsApiService'
import AccountsApiService from './api/AccountsApiService'
import WithdrawalsApiService from './api/WithdrawalsApiService'
import ExchangeRateService from './ExchangeRateService'
import ExchangeRateDao, { PostgresExchangeRateDao } from './dao/ExchangeRateDao'
import { Client } from 'pg'
import WithdrawalsService from './WithdrawalsService'
import PaymentsDao, { PostgresPaymentsDao } from './dao/PaymentsDao'
import WithdrawalsDao, { PostgresWithdrawalsDao } from './dao/WithdrawalsDao'
import { default as GlobalSettingsDao, PostgresGlobalSettingsDao } from './dao/GlobalSettingsDao'
import GlobalSettingsApiService from './api/GlobalSettingsApiService'
import ExchangeRateApiService from './api/ExchangeRateApiService'
import { default as ChannelsDao, PostgresChannelsDao } from './dao/ChannelsDao'
import ChannelClaimsDao, { PostgresChannelClaimsDao } from './dao/ChannelClaimsDao'
import ChannelClaimsService from './ChannelClaimsService'

export default function defaultRegistry (otherRegistry?: Registry): Registry {
  const registry = new Registry(otherRegistry)

  registry.bind('CRAuthManager', (web3: any) => new MemoryCRAuthManager(web3), ['Web3'])
  registry.bind('AuthApiService', (crManager: CRAuthManager, store: Store, config: Config) => new AuthApiService(crManager, store, config), ['CRAuthManager', 'SessionStore', 'Config'])
  registry.bind('BrandingApiService', (config: Config) => new BrandingApiService(config), ['Config'])
  registry.bind('PaymentsApiService', (machinomy: Machinomy, ph: PaymentHandler<any, any>, er: ExchangeRateDao, cw: ChannelWatcher) => new PaymentsApiService(machinomy, ph, er, cw), ['Machinomy', 'PaymentHandler', 'ExchangeRateDao', 'ChannelWatcher'])
  registry.bind('ChannelsApiService', (machinomy: Machinomy, claimsService: ChannelClaimsService) => new ChannelsApiService(machinomy, claimsService), ['Machinomy', 'ChannelClaimsService'])
  registry.bind('AccountsApiService', (paymentsDao: PaymentsDao, wdService: WithdrawalsService, exRateDao: ExchangeRateDao, chDao: ChannelsDao) => new AccountsApiService(paymentsDao, wdService, exRateDao, chDao), ['PaymentsDao', 'WithdrawalsService', 'ExchangeRateDao', 'ChannelsDao'])
  registry.bind('ExchangeRateApiService', (exRateDao: ExchangeRateDao) => new ExchangeRateApiService(exRateDao), ['ExchangeRateDao'])
  registry.bind('WithdrawalsApiService', (dao: WithdrawalsDao) => new WithdrawalsApiService(dao), ['WithdrawalsDao'])
  registry.bind('WithdrawalsService', (dao: WithdrawalsDao, globalSettingsDao: GlobalSettingsDao, web3: any, config: Config) => new WithdrawalsService(dao, globalSettingsDao, web3, config), ['WithdrawalsDao', 'GlobalSettingsDao', 'Web3', 'Config'])
  registry.bind('ExchangeRateService', (dao: ExchangeRateDao) => new ExchangeRateService(dao), ['ExchangeRateDao'])
  registry.bind('ExchangeRateDao', (db: DBEngine<Client>) => new PostgresExchangeRateDao(db), ['DBEngine'])
  registry.bind('ChannelClaimsService', (dao: ChannelClaimsDao, machinomy: Machinomy) => new ChannelClaimsService(dao, machinomy), ['ChannelClaimsDao', 'Machinomy'])
  registry.bind('ChannelClaimsDao', (db: DBEngine<Client>) => new PostgresChannelClaimsDao(db), ['DBEngine'])
  registry.bind('GlobalSettingsDao', (db: DBEngine<Client>) => new PostgresGlobalSettingsDao(db), ['DBEngine'])
  registry.bind('PaymentsDao', (db: DBEngine<Client>, config: Config) => new PostgresPaymentsDao(db, config), ['DBEngine', 'Config'])
  registry.bind('WithdrawalsDao', (db: DBEngine<Client>) => new PostgresWithdrawalsDao(db), ['DBEngine'])
  registry.bind('ChannelsDao', (db: DBEngine<Client>, web3: any) => new PostgresChannelsDao(db, web3), ['DBEngine', 'Web3'])
  registry.bind('AdminApiService', () => new AdminApiService(), [])
  registry.bind('GlobalSettingsApiService', (dao: GlobalSettingsDao) => new GlobalSettingsApiService(dao), ['GlobalSettingsDao'])
  registry.bind('ApiService', (...args: ApiService[]) => [...args], ['AuthApiService', 'BrandingApiService', 'PaymentsApiService', 'ChannelsApiService', 'AdminApiService', 'AccountsApiService', 'WithdrawalsApiService', 'GlobalSettingsApiService', 'ExchangeRateApiService'])
  registry.bind('ChannelWatcher', (machinomy: Machinomy, paymentsDao: PaymentsDao, web3: any) => new ChannelWatcher(machinomy, paymentsDao, web3), ['Machinomy', 'PaymentsDao', 'Web3']); registry.bind('DBEngine', (config: Config) => new PostgresDBEngine(config), ['Config'])
  registry.bind('Machinomy', (config: Config, web3: any) => new Machinomy(config.recipientAddress, web3, {
    databaseUrl: config.databaseUrl,
    closeOnInvalidPayment: false
  }), ['Config', 'Web3'])

  return registry
}

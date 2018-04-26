import camelize from './util/camelize'
import { Registry } from './Container'

const ENV_VARS = [
  'ETH_RPC_URL',
  'DATABASE_URL',
  'AUTH_REALM',
  'AUTH_DOMAIN_WHITELIST',
  'PORT',
  'MIN_SETTLEMENT_PERIOD',
  'RECIPIENT_WHITELIST',
  'SESSION_SECRET',
  'CARD_NAME',
  'CARD_IMAGE_URL'
]

export interface BrandingConfig {
  title?: string
  companyName?: string
  username?: string
  backgroundColor?: string
  textColor?: string
}

export default class Config {
  public ethRpcUrl: string = ''
  public databaseUrl: string = ''
  public redisUrl: string = ''
  public authRealm: string = ''
  public authDomainWhitelist: string[] = []
  public adminAddresses?: string[] = []
  public port: number = 8080
  public minSettlementPeriod?: number = 3
  public recipientAddress: string = ''
  public hotWalletAddress: string = ''
  public sessionSecret: string = ''
  public staleChannelDays: number = 7
  public registry?: Registry
  public branding: BrandingConfig | undefined

  static fromEnv (): Config {
    const instance = new Config()

    ENV_VARS.forEach((v: string) => {
      (instance as any)[camelize(v, '_')] = process.env[v]
    })

    return instance
  }
}

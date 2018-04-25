import { Client } from 'pg'
import Config from './Config'
import { SCLogger } from './util/logging'
import log from './util/log'
import Mutex from './util/Mutex'

export type Executor<T, U> = (client: T) => Promise<U>

export default interface DBEngine<T> {
  connect(): Promise<void>
  disconnect(): Promise<void>
  exec<U>(executor: Executor<T, U>): Promise<U>
}

export class PostgresDBEngine implements DBEngine<Client> {
  private LOG: SCLogger = log('PostgresDBEngine')

  private connectionMutex: Mutex = new Mutex()

  private config: Config

  private client: Client|null = null

  constructor(config: Config) {
    this.config = config
  }

  async connect(): Promise<void> {
    return this.connectionMutex.synchronize(async () => {
      if (this.client) {
        this.LOG.debug('Database is already connected.')
        return
      }

      const client = new Client({
        connectionString: this.config.databaseUrl,
      })

      this.LOG.info('Connecting to Postgres database.')
      await client.connect()
      this.client = client
      this.LOG.info('Successfully connected to Postgres database.')
    })
  }

  async disconnect(): Promise<void> {
    return this.connectionMutex.synchronize(async () => {
      if (!this.client) {
        this.LOG.debug('No active database connection, so nothing to disconnect.')
        return
      }

      this.LOG.debug('Disconnecting from Postgres database.')
      await this.client.end()
      this.client = null
    })
  }

  async exec<U>(executor: Executor<Client, U>): Promise<U> {
    if (!this.client) {
      this.LOG.info('Database is not connected. Attempting connection now.')
      await this.connect()
    }

    this.LOG.info('Executing Postgres query.')
    return executor.call(null, this.client)
  }
}

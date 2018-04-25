import * as BigNumber from 'bignumber.js'
import DBEngine from '../DBEngine'
import { Client } from 'pg'
import { TotalsTuple } from './TipsDao'
import { PaymentChannel, PaymentChannelSerde } from 'machinomy/dist/lib/payment_channel'
import log from '../util/log'
import Config from '../Config'

export default interface PaymentsDao {
  totalAvailableFor (address: string): Promise<TotalsTuple>

  staleChannels (): Promise<PaymentChannel[]>
}

const LOG = log('PostgresPaymentsDao')

export class PostgresPaymentsDao implements PaymentsDao {
  private engine: DBEngine<Client>

  // tslint:disable-next-line:no-unused-variable
  private config: Config

  private staleChannelMs: number

  constructor (engine: DBEngine<Client>, config: Config) {
    this.engine = engine
    this.config = config
    this.staleChannelMs = config.staleChannelDays * 24 * 60 * 60 * 1000
  }

  public totalAvailableFor (address: string): Promise<TotalsTuple> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        `SELECT SUM(amountwei) as totalwei, SUM (amountusd) as totalusd
        FROM payments WHERE receiver = $1 AND withdrawal_id IS NULL`,
        [
          address
        ]
      )

      const row = res.rows[0]

      if ((!row.totalwei && row.totalusd) ||
        (row.totalwei && !row.totalusd)) {
        LOG.warn('For some reason, either total wei or total USD is null when the other ' +
          'is not. This should not happen. Total Wei: {totalWei}, Total USD: {totalUsd}', {
            totalWei: row.totalwei,
            totalUsd: row.totalusd
          })
      }

      if (!row.totalwei || !row.totalusd) {
        return {
          totalWei: new BigNumber.BigNumber(0),
          totalUsd: new BigNumber.BigNumber(0)
        }
      }

      return {
        totalWei: new BigNumber.BigNumber(row.totalwei),
        totalUsd: new BigNumber.BigNumber(row.totalusd)
      }
    })
  }

  public staleChannels (): Promise<PaymentChannel[]> {
    return this.engine.exec(async (c: Client) => {
      // tslint:disable:no-trailing-whitespace
      const res = await c.query(
        `SELECT * FROM channel WHERE "channelId" IN 
            (SELECT "channelId" FROM payments 
            GROUP BY "channelId" 
            HAVING now_millis() - MAX(created_at) > $1
          );`,
        [
          this.staleChannelMs
        ]
      )
      // tslint:enable:no-trailing-whitespace
      return res.rows.map(PaymentChannelSerde.instance.deserialize)
    })
  }
}

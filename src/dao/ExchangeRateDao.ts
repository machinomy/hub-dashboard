import DBEngine from '../DBEngine'
import { Client } from 'pg'
import ExchangeRate from '../domain/ExchangeRate'
import CurrencyCode from '../domain/CurrencyCode'

export default interface ExchangeRateDao {
  record (retrievedAt: number, rateUsd: string): Promise<ExchangeRate>
  latest (): Promise<ExchangeRate>
}

export class PostgresExchangeRateDao implements ExchangeRateDao {
  private engine: DBEngine<Client>

  constructor (engine: DBEngine<Client>) {
    this.engine = engine
  }

  public record (retrievedAt: number, rateUsd: string): Promise<ExchangeRate> {
    return this.engine.exec(async (c: Client) => {
      const ret = await c.query(
        'INSERT INTO exchange_rates (retrievedat, base, rate_usd) VALUES ($1,$2,$3) RETURNING *',
        [
          retrievedAt,
          CurrencyCode.ETH.toString(),
          rateUsd
        ]
      )

      return this.inflateRow(ret.rows[0])
    })
  }

  public latest () {
    return this.engine.exec(async (c: Client) => {
      const ret = await c.query(
        'SELECT * FROM exchange_rates ORDER BY retrievedat DESC LIMIT 1'
      )

      if (!ret.rows.length) {
        throw new Error('No exchange rate found!')
      }

      return this.inflateRow(ret.rows[0])
    })
  }

  private inflateRow (row: any): ExchangeRate {
    return {
      id: row.id,
      retrievedAt: row.retrievedat,
      base: row.base,
      rates: {
        [CurrencyCode.USD.toString()]: row.rate_usd
      }
    }
  }
}

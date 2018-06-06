import * as BigNumber from 'bignumber.js'
import Machinomy from 'machinomy'
import Payment, { PaymentSerde } from 'machinomy/lib/payment'
import DBEngine from '../DBEngine'
import { Client } from 'pg'
import { Tip, TipDto } from '../domain/Tip'
import filterObject from '../util/filterObject'

export interface TotalsTuple {
  totalWei: BigNumber.BigNumber
  totalUsd: BigNumber.BigNumber
}

export default interface TipsDao {
  save (tip: TipDto, payment: Payment): Promise<Tip>

  byAddress (address: string): Promise<Tip[]>

  all (): Promise<Tip[]>
}

export class PostgresTipsDao implements TipsDao {
  private engine: DBEngine<Client>

  // tslint:disable-next-line:no-unused-variable
  private machinomy: Machinomy

  constructor (engine: DBEngine<Client>, machinomy: Machinomy) {
    this.engine = engine
    this.machinomy = machinomy
  }

  public save (tip: TipDto, payment: Payment): Promise<Tip> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        'INSERT INTO tips(streamid, streamname, performerid, performername, performeraddress, paymenttoken, createdat) VALUES($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [
          tip.streamId,
          tip.streamName,
          tip.performerId,
          tip.performerName,
          tip.performerAddress,
          payment.token,
          tip.createdAt
        ]
      )

      const row = res.rows[0]

      return {
        id: row.id,
        streamId: row.streamid,
        streamName: row.streamname,
        performerId: row.performerid,
        performerName: row.performername,
        performerAddress: row.performeraddress,
        createdAt: row.createdat,
        payment
      } as Tip
    })
  }

  public byAddress (address: string): Promise<Tip[]> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        `SELECT ${this.joinColumns()} from tips t JOIN payment p ON p.token = t.paymenttoken WHERE p.sender = $1`,
        [
          address
        ]
      )

      return this.mapRows(res.rows)
    })
  }

  public all (): Promise<Tip[]> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        `SELECT ${this.joinColumns()} FROM tips t JOIN payment p ON p.token = t.paymenttoken`
      )

      return this.mapRows(res.rows)
    })
  }

  private mapRows (rows: any[]): Tip[] {
    if (rows.length === 0) {
      return []
    }

    return rows.map((row: any) => {
      const tip = this.stripPrefix('tips', filterObject(row, (k: string) => (k.indexOf('tips') === 0)))
      const payment = this.stripPrefix('payment', filterObject(row, (k: string) => (k.indexOf('payment') === 0)))

      return {
        id: tip.id,
        streamId: tip.streamid,
        streamName: tip.streamname,
        performerId: tip.performerid,
        performerName: tip.performername,
        performerAddress: tip.performeraddress,
        createdAt: Number(tip.createdat),
        payment: PaymentSerde.instance.deserialize(payment)
      }
    })
  }

  private stripPrefix (prefix: string, object: any): any {
    return Object.keys(object).reduce((acc: any, curr: string) => {
      acc[curr.split('.')[1]] = object[curr]
      return acc
    }, {})
  }

  private joinColumns (): string {
    return `
      t.id "tips.id",
      t.streamid "tips.streamid",
      t.streamname "tips.streamname",
      t.performerid "tips.performerid",
      t.performername "tips.performername",
      t.performeraddress "tips.performeraddress",
      t.createdat "tips.createdat",
      p."channelId" "payment.channelId",
      p.value "payment.value",
      p.sender "payment.sender",
      p.receiver "payment.receiver",
      p.price "payment.price",
      p."channelValue" "payment.channelValue",
      p.v "payment.v",
      p.r "payment.r",
      p.s "payment.s",
      p.token "payment.token"
    `
  }
}

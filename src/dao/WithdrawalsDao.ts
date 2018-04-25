import * as BigNumber from 'bignumber.js'
import Withdrawal, { WithdrawalStatus } from '../domain/Withdrawal'
import DBEngine from '../DBEngine'
import { Client, QueryResult } from 'pg'
import { TotalsTuple } from './TipsDao'

export default interface WithdrawalsDao {
  create (recipient: string): Promise<Withdrawal | null>

  markPending (id: number, txhash: string): Promise<Withdrawal>

  markConfirmed (id: number): Promise<Withdrawal>

  markFailed (id: number): Promise<Withdrawal>

  totalFor (address: string, status: WithdrawalStatus): Promise<TotalsTuple>

  allFor (address: string): Promise<Withdrawal[]>

  byId (id: number): Promise<Withdrawal | null>
}

export class PostgresWithdrawalsDao implements WithdrawalsDao {
  private engine: DBEngine<Client>

  constructor (engine: DBEngine<Client>) {
    this.engine = engine
  }

  create (recipient: string): Promise<Withdrawal | null> {
    return this.engine.exec(async (c: Client) => {
      let res = await c.query(
        'SELECT create_withdrawal_usd_amount($1) as id',
        [
          recipient
        ]
      )

      const id = res.rows[0].id

      if (id === '-1') {
        return null
      }

      res = await c.query(
        'SELECT * from withdrawals WHERE id = $1',
        [
          id
        ]
      )

      return this.inflateRow(res.rows[0])
    })
  }

  markPending (id: number, txhash: string): Promise<Withdrawal> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        'UPDATE withdrawals SET (status, txhash)=($1, $2) WHERE id = $3 RETURNING *',
        [
          WithdrawalStatus.PENDING.toString(),
          txhash,
          id
        ]
      )

      return this.inflateRow(res.rows[0])
    })
  }

  markConfirmed (id: number): Promise<Withdrawal> {
    return this.markState(id, WithdrawalStatus.CONFIRMED)
  }

  markFailed (id: number): Promise<Withdrawal> {
    return this.markState(id, WithdrawalStatus.FAILED)
  }

  totalFor (address: string, status: WithdrawalStatus): Promise<TotalsTuple> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        'SELECT SUM(amountwei) as totalwei, SUM(amountusd) as totalusd FROM withdrawals WHERE recipient = $1 AND status = $2',
        [
          address,
          status.toString()
        ]
      )

      const row = res.rows[0]

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

  allFor (address: string): Promise<Withdrawal[]> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        'SELECT * FROM withdrawals WHERE recipient = $1',
        [
          address
        ]
      )

      return res.rows.map((r: QueryResult) => this.inflateRow(r))
    })
  }

  byId (id: number): Promise<Withdrawal | null> {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        'SELECT * FROM withdrawals WHERE id = $1',
        [
          id
        ]
      )

      if (!res.rows.length) {
        return null
      }

      return this.inflateRow(res.rows[0])
    })
  }

  private markState (id: number, status: WithdrawalStatus) {
    return this.engine.exec(async (c: Client) => {
      const res = await c.query(
        'UPDATE withdrawals SET status = $1 WHERE id = $2 RETURNING *',
        [
          status.toString(),
          id
        ]
      )

      return this.inflateRow(res.rows[0])
    })
  }

  private inflateRow (row: any) {
    return {
      id: Number(row.id),
      recipient: row.recipient,
      amountWei: new BigNumber.BigNumber(row.amountwei),
      amountUsd: new BigNumber.BigNumber(row.amountusd),
      txhash: row.txhash,
      status: row.status,
      createdAt: Number(row.createdat),
      pendingAt: row.pendingat ? Number(row.pendingat) : null,
      confirmedAt: row.confirmedat ? Number(row.confirmedat) : null,
      failedAt: row.failedat ? row.failedat : null
    } as Withdrawal
  }
}

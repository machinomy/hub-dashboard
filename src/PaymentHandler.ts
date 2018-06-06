import * as express from 'express'
import Payment from 'machinomy/lib/payment'
import TipsDao from './dao/TipsDao'
import { Tip, TipDto } from './domain/Tip'

export interface PaymentHandler<T, U> {
  parseMeta (req: express.Request): Promise<T>

  storeMeta (meta: T, payment: Payment): Promise<void>

  fetchHistory (address?: string): Promise<U[]>
}

export class PaymentHandlerImpl implements PaymentHandler<TipDto, Tip> {
  private tipsDao: TipsDao

  constructor (tipsDao: TipsDao) {
    this.tipsDao = tipsDao
  }

  public async parseMeta (req: express.Request): Promise<TipDto> {
    let meta = req.body.payment.meta

    if (!meta) {
      throw new Error('No meta field found in request body.')
    }

    if (typeof meta === 'string') {
      meta = JSON.parse(meta)
    }

    meta = Object.assign({}, meta)

    const isValid = meta.streamId &&
      meta.streamName &&
      meta.performerId &&
      meta.performerName &&
      meta.performerAddress

    if (!isValid) {
      throw new Error('Mal-formed metadata.')
    }

    meta.createdAt = Date.now()

    return meta as TipDto
  }

  public async storeMeta (meta: TipDto, payment: Payment): Promise<void> {
    await this.tipsDao.save(meta, payment)
  }

  fetchHistory (address?: string): Promise<Tip[]> {
    return address ? this.tipsDao.byAddress(address) : this.tipsDao.all()
  }
}

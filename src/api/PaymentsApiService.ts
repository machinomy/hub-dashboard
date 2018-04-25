import Machinomy from 'machinomy/dist'
import * as express from 'express'
import { ApiService } from './ApiService'
import { PaymentHandler } from '../PaymentHandler'
import log from '../util/log'
import { WithPayment } from '../domain/WithPayment'
import ChannelWatcher from '../ChannelWatcher'
import { Role } from '../Role'
import ExchangeRateDao from '../dao/ExchangeRateDao'
import { ownedAddressOrAdmin } from '../util/ownedAddressOrAdmin'
import {PaymentSerde} from 'machinomy/dist/lib/payment'

const LOG = log('PaymentsApiService')

export default class PaymentsApiService implements ApiService {
  namespace = 'payments'

  router: express.Router = express.Router()

  private machinomy: Machinomy

  private paymentHandler: PaymentHandler<any, any>

  private exchangeRateDao: ExchangeRateDao

  private channelWatcher: ChannelWatcher

  constructor (machinomy: Machinomy, paymentHandler: PaymentHandler<any, any>, exchangeRateDao: ExchangeRateDao, channelWatcher: ChannelWatcher) {
    this.machinomy = machinomy
    this.paymentHandler = paymentHandler
    this.exchangeRateDao = exchangeRateDao
    this.channelWatcher = channelWatcher

    this.doBuy = this.doBuy.bind(this)
    this.doPaymentHistory = this.doPaymentHistory.bind(this)
    this.setupRoutes()
  }

  private async doBuy (req: express.Request, res: express.Response) {
    LOG.info('Received payment.')

    const paymentReq = req.body.payment

    if (!paymentReq) {
      LOG.warn('Payment not supplied in request body: {body}', {
        body: req.body
      })
      return res.sendStatus(400)
    }

    let parsedMeta

    try {
      parsedMeta = await this.paymentHandler.parseMeta(req)
    } catch (err) {
      LOG.warn('Failed to parse payment metadata: {err}', {
        err
      })
      return res.sendStatus(400)
    }

    let token

    try {
      token = (await this.machinomy.acceptPayment({
        payment: paymentReq
      })).token
    } catch (err) {
      LOG.warn('Failed to accept payment: {err}. Payment request: {payment}', {
        err,
        payment: JSON.stringify(paymentReq)
      })

      return res.sendStatus(400)
    }

    const payment = await this.machinomy.paymentById(token)

    if (!payment) {
      LOG.error('Could not find payment with token {token}. This should never happen!', {
        token
      })
      return res.sendStatus(500)
    }

    await this.paymentHandler.storeMeta(parsedMeta, payment)

    res.send({
      token: payment.token
    })
  }

  private async doPaymentHistory (req: express.Request, res: express.Response) {
    const targetAddr = req.params.address
    const requesterAddr = req.session!.address

    if (!ownedAddressOrAdmin(req)) {
      LOG.info('Blocked attempt to view payment history for {targetAddr} from {requesterAddr}', {
        targetAddr,
        requesterAddr
      })
      return res.sendStatus(403)
    }

    let history

    try {
      history = await this.paymentHandler.fetchHistory(targetAddr) as WithPayment[]
    } catch (err) {
      LOG.error('Failed to fetch payment history: {err}', {
        err
      })
      return res.sendStatus(500)
    }

    const data = history.map((item: any) => Object.keys(item).reduce((acc: any, k: string) => {
      if (k === 'payment') {
        acc.payment = {
          channelId: item.payment.channelId,
          sender: item.payment.sender,
          price: item.payment.price.toString(),
          token: item.payment.token
        }
      } else {
        acc[k] = item[k]
      }

      return acc
    }, {}))

    res.send(data)
  }

  private setupRoutes () {
    this.router.post('/', this.doBuy)
    this.router.get('/', this.doPaymentHistory)
    this.router.get('/:address?', this.doPaymentHistory)
  }
}

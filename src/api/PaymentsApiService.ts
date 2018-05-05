import Machinomy from 'machinomy/dist'
import * as express from 'express'
import Payment, { PaymentSerde } from 'machinomy/dist/lib/payment'
import PaymentsDao from '../dao/PaymentsDao'
import { ApiService } from './ApiService'
import log from '../util/log'
import ChannelWatcher from '../ChannelWatcher'
import ExchangeRateDao from '../dao/ExchangeRateDao'
import { ownedAddressOrAdmin } from '../util/ownedAddressOrAdmin'

const LOG = log('PaymentsApiService')

export default class PaymentsApiService implements ApiService {
  namespace = 'payments'

  router: express.Router = express.Router()

  private machinomy: Machinomy

  // tslint:disable-next-line:no-unused-variable
  private exchangeRateDao: ExchangeRateDao

  // tslint:disable-next-line:no-unused-variable
  private channelWatcher: ChannelWatcher

  private paymentsDao: PaymentsDao

  constructor (machinomy: Machinomy, paymentDao: PaymentsDao, exchangeRateDao: ExchangeRateDao, channelWatcher: ChannelWatcher) {
    this.machinomy = machinomy
    this.paymentsDao = paymentDao
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
      history = await this.paymentsDao.getAll()
    } catch (err) {
      LOG.error('Failed to fetch payment history: {err}', {
        err
      })
      return res.sendStatus(500)
    }
    const data = history.map((payment: Payment) => PaymentSerde.instance.serialize(payment))

    res.send(data)
  }

  private setupRoutes () {
    this.router.post('/', this.doBuy)
    this.router.get('/', this.doPaymentHistory)
    this.router.get('/:address?', this.doPaymentHistory)
  }
}

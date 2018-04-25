import * as express from 'express'
import { ApiService } from './ApiService'
import { default as Withdrawal, WithdrawalStatus, withdrawalToJson } from '../domain/Withdrawal'
import WithdrawalsService from '../service/WithdrawalsService'
import PaymentsDao from '../dao/PaymentsDao'
import ExchangeRateDao from '../dao/ExchangeRateDao'
import log from '../util/log'
import { ownedAddressOrAdmin } from '../util/ownedAddressOrAdmin'
import { fiatToWei } from '../util/conversions'
import ChannelsDao from '../dao/ChannelsDao'

const LOG = log('AccountsApiService')

export default class AccountsApiService implements ApiService {
  namespace = 'accounts'

  router: express.Router = express.Router()

  private paymentsDao: PaymentsDao

  private withdrawalsService: WithdrawalsService

  private exchangeRateDao: ExchangeRateDao

  private channelsDao: ChannelsDao

  constructor (paymentsDao: PaymentsDao, withdrawalsService: WithdrawalsService, exchangeRateDao: ExchangeRateDao, channelsDao: ChannelsDao) {
    this.paymentsDao = paymentsDao
    this.withdrawalsService = withdrawalsService
    this.exchangeRateDao = exchangeRateDao
    this.channelsDao = channelsDao

    this.doBalance = this.doBalance.bind(this)
    this.doChannels = this.doChannels.bind(this)
    this.doWithdraw = this.doWithdraw.bind(this)
    this.doWithdrawals = this.doWithdrawals.bind(this)

    this.setupRoutes()
  }

  private async doBalance (req: express.Request, res: express.Response) {
    if (!ownedAddressOrAdmin(req)) {
      res.sendStatus(403)
      return
    }

    const address = req.params.address

    const currentRate = (await this.exchangeRateDao.latest()).rates.USD
    const totalPayments = await this.paymentsDao.totalAvailableFor(address)
    const totalConfirmedWithdrawals = await this.withdrawalsService.totalFor(address, WithdrawalStatus.CONFIRMED)
    const totalPendingWithdrawals = await this.withdrawalsService.totalFor(address, WithdrawalStatus.PENDING)

    const availableUsd = totalPayments.totalUsd
    const availableWei = fiatToWei(availableUsd, currentRate)

    res.send({
      availableWei: availableWei.toFixed(0),
      availableUsd: availableUsd.toFixed(2),
      pendingWithdrawalWei: totalPendingWithdrawals.totalWei.toFixed(0),
      pendingWithdrawalUsd: totalPendingWithdrawals.totalUsd.toFixed(2),
      withdrawnWei: totalConfirmedWithdrawals.totalWei.toFixed(0),
      withdrawnUsd: totalConfirmedWithdrawals.totalUsd.toFixed(2)
    })
  }

  private async doChannels (req: express.Request, res: express.Response) {
    if (!ownedAddressOrAdmin(req)) {
      res.sendStatus(403)
      return
    }

    const address = req.params.address

    try {
      const chans = await this.channelsDao.allOpenFor(address)
      res.send(chans)
    } catch (err) {
      LOG.error('Failed to fetch open channel IDs for {address}: {err}', {
        address,
        err
      })
      res.sendStatus(500)
    }
  }

  private async doWithdrawals (req: express.Request, res: express.Response) {
    if (!ownedAddressOrAdmin(req)) {
      res.sendStatus(403)
      return
    }

    try {
      const rows = await this.withdrawalsService.allFor(req.params.address)
      res.send(rows.map((wd: Withdrawal) => withdrawalToJson(wd)))
    } catch (err) {
      LOG.error('Failed to fetch withdrawals: {err}', {
        err
      })
      res.sendStatus(500)
    }
  }

  private async doWithdraw (req: express.Request, res: express.Response) {
    if (!ownedAddressOrAdmin(req)) {
      res.sendStatus(403)
      return
    }

    try {
      const wd = await this.withdrawalsService.withdraw(req.params.address)
      res.send(withdrawalToJson(wd))
    } catch (err) {
      LOG.error('Failed to withdraw funds: {err}', {
        err
      })
      res.sendStatus(500)
    }
  }

  private setupRoutes () {
    this.router.get('/:address/balance', this.doBalance)
    this.router.get('/:address/channelIds', this.doChannels)
    this.router.post('/:address/withdraw', this.doWithdraw)
    this.router.get('/:address/withdrawals', this.doWithdrawals)
  }
}

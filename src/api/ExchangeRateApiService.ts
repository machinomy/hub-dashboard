import * as express from 'express'
import { ApiService } from './ApiService'
import ExchangeRateDao from '../dao/ExchangeRateDao'
import log from '../util/log'

const LOG = log('ExchangeRateApiService')

export default class ExchangeRateApiService implements ApiService {
  namespace = 'exchangeRate'

  router: express.Router = express.Router()

  private dao: ExchangeRateDao

  constructor (dao: ExchangeRateDao) {
    this.dao = dao

    this.doRate = this.doRate.bind(this)
    this.setupRoutes()
  }

  async doRate (req: express.Request, res: express.Response) {
    try {
      const rate = await this.dao.latest()
      res.send(rate)
    } catch (err) {
      LOG.error('Failed to fetch latest exchange rate: {err}', {
        err
      })
      res.sendStatus(500)
    }
  }

  private setupRoutes() {
    this.router.get('/', this.doRate)
  }
}

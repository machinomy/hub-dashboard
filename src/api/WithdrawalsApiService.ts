import * as express from 'express'
import {ApiService} from './ApiService'
import {withdrawalToJson} from '../domain/Withdrawal'
import WithdrawalsDao from '../dao/WithdrawalsDao'
import log from '../util/log'

const LOG = log('WithdrawalsApiService')

export default class WithdrawalsApiService implements ApiService {
  namespace = 'withdrawals'

  router: express.Router = express.Router()

  withdrawalsDao: WithdrawalsDao

  constructor (withdrawalsDao: WithdrawalsDao) {
    this.withdrawalsDao = withdrawalsDao

    this.doGet = this.doGet.bind(this)

    this.setupRoutes()
  }

  private async doGet (req: express.Request, res: express.Response) {
    let wd

    try {
      wd = await this.withdrawalsDao.byId(req.params.id)
    } catch (err) {
      LOG.error('Failed to get withdrawal {id}: {err}', {
        id: req.params.id,
        err
      })

      return res.sendStatus(500)
    }

    if (!wd) {
      return res.sendStatus(404)
    }

    res.send(withdrawalToJson(wd))
  }

  private setupRoutes () {
    this.router.get('/:id', this.doGet)
  }
}

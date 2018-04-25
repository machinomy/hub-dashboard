import * as express from 'express'
import { ApiService } from './ApiService'
import GlobalSettingsDao from '../dao/GlobalSettingsDao'
import log from '../util/log'

const LOG = log('GlobalSettingsApiService')

export default class GlobalSettingsApiService implements ApiService {
  namespace = 'globalSettings'

  router: express.Router = express.Router()

  private globalSettingsDao: GlobalSettingsDao

  constructor (globalSettingsDao: GlobalSettingsDao) {
    this.globalSettingsDao = globalSettingsDao

    this.doToggleWithdrawalsEnabled = this.doToggleWithdrawalsEnabled.bind(this)
    this.doTogglePaymentsEnabled = this.doTogglePaymentsEnabled.bind(this)
    this.doFetch = this.doFetch.bind(this)

    this.setupRoutes()
  }

  public async doToggleWithdrawalsEnabled (req: express.Request, res: express.Response) {
    if (typeof req.body.status !== 'boolean') {
      res.sendStatus(400)
      return
    }

    try {
      await this.globalSettingsDao.toggleWithdrawalsEnabled(req.body.status)
      await this.doFetch(req, res)
    } catch (err) {
      LOG.error('Failed to toggle withdrawals enabled: {err}', {
        err
      })
      res.sendStatus(500)
    }
  }

  public async doTogglePaymentsEnabled (req: express.Request, res: express.Response) {
    if (typeof req.body.status !== 'boolean') {
      res.sendStatus(400)
      return
    }

    try {
      await this.globalSettingsDao.togglePaymentsEnabled(req.body.status)
      this.doFetch(req, res)
    } catch (err) {
      LOG.error('Failed to toggle payments enabled: {err}', {
        err
      })
      res.sendStatus(500)
    }
  }

  public async doFetch (req: express.Request, res: express.Response) {
    try {
      const settings = await this.globalSettingsDao.fetch()
      res.send(settings)
    } catch (err) {
      LOG.error('Failed to fetch global settings: {err}', {
        err
      })
      res.sendStatus(500)
    }
  }

  setupRoutes () {
    this.router.post('/withdrawalsEnabled', this.doToggleWithdrawalsEnabled)
    this.router.post('/paymentsEnabled', this.doTogglePaymentsEnabled)
    this.router.get('/', this.doFetch)
  }
}

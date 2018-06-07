import Config from './Config'
import * as express from 'express'
import * as session from 'express-session'
import * as cookie from 'cookie-parser'
import log from './util/log'
import { Container } from './Container'
import defaultRegistry from './services'
import AuthApiService from './api/AuthApiService'
import { ApiService } from './api/ApiService'
import { default as AuthHandler, DefaultAuthHandler } from './middleware/AuthHandler'
import AuthHeaderMiddleware from './middleware/AuthHeaderMiddleware'
import ChannelWatcher from './ChannelWatcher'
import * as path from 'path'
import * as cors from 'cors'
import ExchangeRateService from './service/ExchangeRateService'

const Web3 = require('web3')

const LOG = log('PaymentHub')

const SESSION_LOG = log('ConnectRedis')

const RedisStore = require('connect-redis')(session)

export default class PaymentHub {
  private config: Config

  private app: express.Application

  private container: Container

  private authHandler: AuthHandler

  private channelWatcher: ChannelWatcher

  private exchangeRateService: ExchangeRateService

  constructor (config: Config) {
    this.authenticateRoutes = this.authenticateRoutes.bind(this)

    const registry = defaultRegistry(config.registry)
    const store = new RedisStore({
      url: config.redisUrl,
      logErrors: (err: any) => SESSION_LOG.error('Encountered error in Redis session: {err}', {
        err
      })
    })
    const COOKIE_NAME = 'hub.sid'

    registry.bind('Config', () => config)
    registry.bind('Web3', () => new Web3(config.provider))
    registry.bind('AuthHandler', (config: Config) => new DefaultAuthHandler(config), ['Config'])
    registry.bind('SessionStore', () => store)

    this.config = config
    this.container = new Container(registry)
    this.authHandler = this.container.resolve<AuthHandler>('AuthHandler')
    this.channelWatcher = this.container.resolve<ChannelWatcher>('ChannelWatcher')
    this.exchangeRateService = this.container.resolve<ExchangeRateService>('ExchangeRateService')

    this.app = express()

    const corsHandler = cors({
      origin: true,
      credentials: true
    })
    this.app.options('*', corsHandler)
    this.app.use(corsHandler)

    this.app.use(cookie())
    this.app.use(new AuthHeaderMiddleware(COOKIE_NAME, this.config.sessionSecret).middleware)
    this.app.use(session({
      secret: this.config.sessionSecret,
      name: COOKIE_NAME,
      resave: false,
      store,
      cookie: {
        httpOnly: true
      }
    }))
    this.app.use(express.json())
    this.app.use('/assets', express.static(path.join(__dirname, './', 'public')))
    this.app.use(this.authenticateRoutes)
    this.setupRoutes()
  }

  public async start (): Promise<void> {
    try {
      await this.channelWatcher.start()
    } catch (err) {
      LOG.error('Failed to start channel watcher: {err}', {
        err
      })

      process.exit(1)
    }

    try {
      this.exchangeRateService.start()
    } catch (err) {
      LOG.error('Failed to start exchange rate service: {err}', {
        err
      })

      process.exit(1)
    }

    // tslint:disable-next-line:no-unnecessary-type-assertion
    return new Promise((resolve) => this.app.listen(this.config.port, () => {
      LOG.info('Listening on port {port}.', {
        port: this.config.port
      })
      resolve()
    })) as Promise<void>
  }

  public async closeSettlingChannels () {
    await this.channelWatcher.start()
    await this.channelWatcher.closeSettlingChannels()
  }

  private setupRoutes () {
    const apiServices: AuthApiService[] = this.container.resolve('ApiService')
    apiServices.forEach((s: ApiService) => {
      LOG.debug(`Setting up API service at /{namespace}.`, {
        namespace: s.namespace
      })
      this.app.use(`/${s.namespace}`, s.router)
    })
  }

  private async authenticateRoutes (req: express.Request, res: express.Response, next: () => void) {
    const roles = await this.authHandler.rolesFor(req)
    req.session!.roles = new Set(roles)
    const allowed = await this.authHandler.isAuthorized(req)

    if (!allowed) {
      return res.sendStatus(403)
    }

    next()
  }
}

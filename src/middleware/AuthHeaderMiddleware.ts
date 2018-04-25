import * as express from 'express'
import { sign } from 'cookie-signature'
import parseAuthHeader from '../util/parseAuthHeader'
import log from '../util/log'

const LOG = log('AuthHeaderMiddleware')

export default class AuthHeaderMiddleware {
  private cookieName: string

  private cookieSecret: string

  constructor (cookieName: string, cookieSecret: string) {
    this.cookieName = cookieName
    this.cookieSecret = cookieSecret
    this.middleware = this.middleware.bind(this)
  }

  public middleware (req: express.Request, res: express.Response, next: () => void) {
    const token = parseAuthHeader(req)

    if (!token) {
      LOG.debug('No token found, skipping.')
      return next()
    }

    if (req.headers.cookie) {
      LOG.debug('Cookie found, skipping.')
      return next()
    }

    LOG.debug('Stuffing authorization header into cookies.')
    req.headers.cookie = `${this.cookieName}=s:${sign(token, this.cookieSecret)}`
    next()
  }
}

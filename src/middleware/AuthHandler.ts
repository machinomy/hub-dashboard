import * as express from 'express'
import { RouteBasedACL } from '../RouteBasedAcl'
import log from '../util/log'
import Config from '../Config'
import { Role } from '../Role'

const LOG = log('AuthHandler')

export default interface AuthHandler {
  isAuthorized (req: express.Request): Promise<boolean>
  rolesFor (req: express.Request): Promise<Role[]>
}

export class DefaultAuthHandler implements AuthHandler {
  private acl: RouteBasedACL = new RouteBasedACL()

  private config: Config

  private adminAddresses: Set<string> = new Set()

  constructor (config: Config) {
    this.config = config

    this.cacheConfig()
    this.defaultAcl()
  }

  async rolesFor (req: express.Request): Promise<Role[]> {
    // tslint:disable-next-line:no-unnecessary-type-assertion
    if (!req.session || req.session!.address === undefined) {
      return [Role.NONE]
    }

    const roles = [Role.AUTHENTICATED]

    // tslint:disable-next-line:no-unnecessary-type-assertion
    if (this.adminAddresses.has(req.session!.address)) {
      roles.push(Role.ADMIN)
    }

    return roles
  }

  async isAuthorized (req: express.Request): Promise<boolean> {
    const perm = this.acl.permissionForRoute(req.path)

    if (perm === Role.NONE) {
      return true
    }

    let authorized

    if (perm === Role.ADMIN) {
      authorized = req.session!.roles.has(Role.ADMIN)
    } else {
      authorized = req.session!.roles.has(Role.AUTHENTICATED)
    }

    if (!authorized) {
      LOG.warn('Unauthorized request for route: {path}', {
        path: req.path
      })
    }

    return authorized
  }

  private cacheConfig () {
    if (!this.config.adminAddresses) {
      return
    }

    this.config.adminAddresses.forEach((addr: string) => this.adminAddresses.add(addr))
  }

  private defaultAcl () {
    this.acl.addRoute('/branding', Role.NONE)
      .addRoute('/auth/(.*)', Role.NONE)
      .addRoute('/admin/(.*)', Role.NONE)
      .addRoute('/assets/(.*)', Role.NONE)
      .addRoute('/withdrawals/(.*)', Role.NONE)
      .addRoute('/globalSettings/(.*)', Role.ADMIN)
      .addRoute('/exchangeRate/(.*)', Role.NONE)
  }
}

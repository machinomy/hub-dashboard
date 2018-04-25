import * as express from 'express'
import { ApiService } from './ApiService'
import Config from '../Config'

export default class BrandingApiService implements ApiService {
  namespace = 'branding'

  router: express.Router = express.Router()

  config: Config

  constructor (config: Config) {
    this.config = config
    this.doBranding = this.doBranding.bind(this)
    this.setupRoutes()
  }

  private doBranding (req: express.Request, res: express.Response) {
    res.send({
      title: this.config.branding.title || '',
      companyName: this.config.branding.companyName || '',
      username: this.config.branding.username || '',
      backgroundColor: this.config.branding.backgroundColor || '',
      textColor: this.config.branding.textColor || '',
      address: this.config.recipientAddress
    })
  }

  private setupRoutes () {
    this.router.get('/', this.doBranding)
  }
}

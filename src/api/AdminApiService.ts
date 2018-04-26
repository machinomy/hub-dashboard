import * as express from 'express'
import { ApiService } from './ApiService'
import * as path from 'path'

export class AdminApiService implements ApiService {
  namespace = 'admin'

  router: express.Router = express.Router()

  constructor () {
    this.render = this.render.bind(this)
    this.setupRoutes()
  }

  private render (req: express.Request, res: express.Response) {
    res.sendFile(path.resolve(__dirname, '../public/index.html'))
  }

  private setupRoutes () {
    this.router.get('/*', this.render)
  }
}

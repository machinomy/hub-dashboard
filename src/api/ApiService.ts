import { Router } from 'express'

export interface ApiService {
  namespace: string
  router: Router
}

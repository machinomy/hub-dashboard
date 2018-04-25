import Payment from 'machinomy/dist/lib/payment'
import { WithPayment } from './WithPayment'

export class TipDto {
  streamId: string
  streamName: string
  performerId: string
  performerName: string
  performerAddress: string
  createdAt: number
}

export class Tip implements WithPayment {
  id: number
  streamId: string
  streamName: string
  performerId: string
  performerName: string
  performerAddress: string
  createdAt: number
  payment: Payment
}

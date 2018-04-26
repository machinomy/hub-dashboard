import Payment from 'machinomy/dist/lib/payment'
import { WithPayment } from './WithPayment'

export class TipDto {
  streamId: string | undefined
  streamName: string | undefined
  performerId: string | undefined
  performerName: string | undefined
  performerAddress: string | undefined
  createdAt: number | undefined
}

export class Tip implements WithPayment {
  id: number | undefined
  streamId: string | undefined
  streamName: string | undefined
  performerId: string | undefined
  performerName: string | undefined
  performerAddress: string | undefined
  createdAt: number | undefined
  payment: Payment | undefined
}

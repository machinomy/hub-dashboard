import * as BigNumber from 'bignumber.js'

export default interface ExchangeRate {
  id: number
  retrievedAt: number
  base: string
  rates: {
    [k: string]: BigNumber.BigNumber
  }
}

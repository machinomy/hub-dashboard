import { BigNumber } from 'bignumber.js'

export function fiatToWei (fiat: BigNumber, rate: BigNumber): BigNumber {
  return fiat.dividedBy(rate).multipliedBy('1e18').integerValue(BigNumber.ROUND_FLOOR)
}

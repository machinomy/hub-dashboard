import * as BigNumber from 'bignumber.js'

export function fiatToWei (fiat: BigNumber.BigNumber, rate: BigNumber.BigNumber): BigNumber.BigNumber {
  return fiat.dividedBy(rate).mul('1e18').floor()
}

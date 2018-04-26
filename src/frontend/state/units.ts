import * as BigNumber from 'bignumber.js'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import * as backend from '../backend'

const ONE_HOUR = 60 * 60 * 1000

export const SET_ACTIVE_UNIT = 'UNITS/SET_ACTIVE'
export const SET_ETH_USD_RATE = 'UNITS/SET_ETH_USD_RATE'

export enum Unit {
  WEI,
  ETH,
  USD
}

export interface UnitsState {
  activeUnit: Unit
  ethUsdRate: BigNumber.BigNumber
}

export interface SetActiveUnitAction extends Action {
  payload: Unit
}

export interface SetEthUsdRateAction extends Action {
  payload: BigNumber.BigNumber
}

function getInitialState () {
  return {
    activeUnit: Unit.ETH,
    ethUsdRate: new BigNumber.BigNumber(0)
  }
}

export function setEthUsdRate (rate: BigNumber.BigNumber): SetEthUsdRateAction {
  return {
    payload: rate,
    type: SET_ETH_USD_RATE
  }
}

export function checkEthUsdRate (): ThunkAction<Promise<SetEthUsdRateAction>, UnitsState, void> {
  return async (dispatch) => {
    const data = await backend.getJSON('https://api.coinbase.com/v2/exchange-rates?currency=ETH')
    const rate = new BigNumber.BigNumber(data.data.rates.USD)
    return dispatch(setEthUsdRate(rate))
  }
}

export function pollEthUsdRate (): ThunkAction<Promise<AnyAction>, UnitsState, void> {
  return async (dispatch) => {
    const ret = await dispatch(checkEthUsdRate())
    setTimeout(() => dispatch(pollEthUsdRate), ONE_HOUR)
    return ret
  }
}

export function setActiveUnit (unit: Unit): SetActiveUnitAction {
  return {
    payload: unit,
    type: SET_ACTIVE_UNIT
  }
}

function reduceSetActiveUnit (state: UnitsState, action: SetActiveUnitAction): UnitsState {
  return {
    ...state,
    activeUnit: action.payload
  }
}

export function reducer (state: UnitsState, action: AnyAction) {
  if (!state) {
    return getInitialState()
  }

  switch (action.type) {
    case SET_ACTIVE_UNIT:
      return reduceSetActiveUnit(state, action as SetActiveUnitAction)
    default:
      return state
  }
}

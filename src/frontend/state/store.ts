import { createStore, applyMiddleware, combineReducers, Store } from 'redux'
import thunk from 'redux-thunk'
import logger from 'redux-logger'
import { reducer as login, LoginState } from './login'
import { PaymentsState, reducer as payments } from './payments'
import { reducer as units, UnitsState } from './units'
import { ChannelsState, reducer as channels } from './channels'
import { Web3State, reducer as web3Reducer } from './web3'
import GlobalSettings from '../../domain/GlobalSettings'
import { reducer as globalSettings } from './globalSettings'

export interface AppState {
  readonly login: LoginState
  readonly payments: PaymentsState
  readonly channels: ChannelsState
  readonly units: UnitsState
  readonly web3: Web3State
  readonly globalSettings: GlobalSettings
}
// tslint:disable-next-line:no-unnecessary-type-assertion
const store = createStore(combineReducers({
  login,
  payments,
  units,
  channels,
  web3: web3Reducer,
  globalSettings
}), applyMiddleware(thunk, logger)) as Store<AppState>

export default store

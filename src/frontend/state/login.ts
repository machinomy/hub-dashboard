import { AuthenticationClient } from '../../AuthenticationClient'
import pify from '../../util/pify'
import w3 from '../web3'
import { ThunkAction } from 'redux-thunk'
import { Action, AnyAction } from 'redux'
import * as backend from '../backend'

export const SET_ADDRESS = 'LOGIN/SET_ADDRESS'

export interface LoginState {
  address: string | null
}

export interface SetAddressAction extends Action {
  payload: string | null
}

function getInitialState () {
  return {
    address: null
  }
}

export function setAddress (address: string | null): SetAddressAction {
  return {
    payload: address,
    type: SET_ADDRESS
  }
}

function reduceSetAddress (state: LoginState, action: SetAddressAction) {
  return {
    ...state,
    address: action.payload
  }
}

export function login (): ThunkAction<Promise<SetAddressAction>, LoginState, void> {
  return async (dispatch) => {
    const client = new AuthenticationClient(backend.fullHost(), w3(), fetch.bind(window))
    const accounts = await pify<string[]>(cb => w3().eth.getAccounts(cb))
    const res = await client.authenticate(accounts[0], window.location.hostname)
    return dispatch(setAddress(res.address))
  }
}

export function checkStatus (): ThunkAction<Promise<SetAddressAction>, LoginState, void> {
  return async (dispatch) => {
    let status

    try {
      status = await backend.getJSON('/auth/status')
    } catch (e) {
      status = {
        success: false
      }
    }

    if (!status.success) {
      return dispatch(setAddress(null))
    }

    return dispatch(setAddress(status.address))
  }
}

export function reducer (state: LoginState, action: AnyAction): LoginState {
  if (!state) {
    return getInitialState()
  }

  switch (action.type) {
    case SET_ADDRESS:
      return reduceSetAddress(state, action as SetAddressAction)
    default:
      return state
  }
}

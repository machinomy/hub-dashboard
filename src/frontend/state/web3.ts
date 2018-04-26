import { ThunkAction } from 'redux-thunk'
import w3 from '../web3'
import { Action, AnyAction } from 'redux'

export const SET_WEB3_STATUS = 'WEB3/STATUS/SET'

export enum Web3Status {
  CHECKING,
  FOUND,
  NOT_FOUND
}

export interface Web3State {
  status: Web3Status
}

export interface SetWeb3StatusAction extends Action {
  payload: Web3Status
}

function getInitialState (): Web3State {
  return {
    status: Web3Status.CHECKING
  }
}

function setWeb3Status (status: Web3Status): SetWeb3StatusAction {
  return {
    payload: status,
    type: SET_WEB3_STATUS
  }
}

function reduceSetWeb3Status (state: Web3State, status: Web3Status): Web3State {
  return {
    ...state,
    status
  }
}

export function pollWeb3 (): ThunkAction<Promise<SetWeb3StatusAction>, Web3State, void> {
  return async (dispatch) => {
    const timeout = 5000
    let start = Date.now()
    const status = await new Promise(doPoll)
    return dispatch(setWeb3Status(status))

    function doPoll (resolve: (status: Web3Status) => void, reject: (err: any) => void) {
      if (Date.now() - start > timeout) {
        return resolve(Web3Status.NOT_FOUND)
      }

      if (w3()) {
        return resolve(Web3Status.FOUND)
      }

      setTimeout(() => doPoll(resolve, reject), 250)
      return
    }
  }
}

export function reducer (state: Web3State, action: AnyAction): Web3State {
  if (!state) {
    return getInitialState()
  }

  switch (action.type) {
    case SET_WEB3_STATUS:
      return reduceSetWeb3Status(state, (action as SetWeb3StatusAction).payload)
    default:
      return state
  }
}

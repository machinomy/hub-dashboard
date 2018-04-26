import GlobalSettings from '../../domain/GlobalSettings'
import { Action, AnyAction } from 'redux'
import { ThunkAction } from 'redux-thunk'
import * as backend from '../backend'

export const TOGGLE_WITHDRAWALS_ENABLED = 'globalSettings/TOGGLE_WITHDRAWALS_ENABLED'
export const TOGGLE_PAYMENTS_ENABLED = 'globalSettings/TOGGLE_PAYMENTS_ENABLED'
export const SET_GLOBAL_SETTINGS = 'globalSettings/SET_GLOBAL_SETTINGS'

export interface ToggleSettingAction extends Action {
  type: string
  payload: {
    status: boolean
  }
}

export interface SetGlobalSettingsAction extends Action {
  payload: GlobalSettings
}

export function setGlobalSettings (settings: GlobalSettings): SetGlobalSettingsAction {
  return {
    type: SET_GLOBAL_SETTINGS,
    payload: settings
  }
}

export function fetchGlobalSettings (): ThunkAction<Promise<SetGlobalSettingsAction>, GlobalSettings, void> {
  return async (dispatch) => {
    const data = await backend.getJSON('/globalSettings')
    return dispatch(setGlobalSettings(data))
  }
}

export function toggleWithdrawalsEnabled (status: boolean): ThunkAction<Promise<ToggleSettingAction>, GlobalSettings, void> {
  return async (dispatch) => {
    await backend.postJSON('/globalSettings/withdrawalsEnabled', {
      status
    })

    return dispatch({
      type: TOGGLE_WITHDRAWALS_ENABLED,
      payload: {
        status
      }
    })
  }
}

export function togglePaymentsEnabled (status: boolean): ThunkAction<Promise<ToggleSettingAction>, GlobalSettings, void> {
  return async (dispatch) => {
    await backend.postJSON('/globalSettings/paymentsEnabled', {
      status
    })

    return dispatch({
      type: TOGGLE_PAYMENTS_ENABLED,
      payload: {
        status
      }
    })
  }
}

export function reduceSetGlobalSettings (state: GlobalSettings, action: SetGlobalSettingsAction) {
  return action.payload
}

function getInitialState (): GlobalSettings {
  return {
    withdrawalsEnabled: true,
    paymentsEnabled: true
  }
}

function reduceToggleSetting (state: GlobalSettings, action: ToggleSettingAction) {
  return {
    ...state,
    [action.type === TOGGLE_WITHDRAWALS_ENABLED ? 'withdrawalsEnabled' : 'paymentsEnabled']: action.payload.status
  }
}

export function reducer (state: GlobalSettings, action: AnyAction): GlobalSettings {
  if (!state) {
    return getInitialState()
  }

  switch (action.type) {
    case TOGGLE_WITHDRAWALS_ENABLED:
    case TOGGLE_PAYMENTS_ENABLED:
      return reduceToggleSetting(state, action as ToggleSettingAction)
    case SET_GLOBAL_SETTINGS:
      return reduceSetGlobalSettings(state, action as SetGlobalSettingsAction)
    default:
      return state
  }
}

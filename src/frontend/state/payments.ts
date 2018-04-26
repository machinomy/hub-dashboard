import { WithPayment } from '../../domain/WithPayment'
import * as backend from '../backend'
import { ThunkAction } from 'redux-thunk'
import { Action, AnyAction } from 'redux'

export type EnrichedPayment = WithPayment

export const SET_PAYMENTS = 'PAYMENTS/SET'

export interface PaymentsState {
  payments: EnrichedPayment[]
}

export interface SetPaymentAction extends Action {
  payload: EnrichedPayment[]
}

function getInitialState (): PaymentsState {
  return {
    payments: []
  }
}

export function setPayments (payments: EnrichedPayment[]): SetPaymentAction {
  return {
    payload: payments,
    type: SET_PAYMENTS
  }
}

function reduceSetPayments (state: PaymentsState, payments: EnrichedPayment[]): PaymentsState {
  return {
    ...state,
    payments
  }
}

export function fetchPayments (address?: string): ThunkAction<Promise<SetPaymentAction>, PaymentsState, void> {
  return async (dispatch) => {
    const data = await backend.getJSON(`/payments/${address || ''}`)
    return dispatch(setPayments(data))
  }
}

export function reducer (state: PaymentsState, action: AnyAction): PaymentsState {
  if (!state) {
    return getInitialState()
  }

  switch (action.type) {
    case SET_PAYMENTS:
      return reduceSetPayments(state, (action as SetPaymentAction).payload)
    default:
      return state
  }
}

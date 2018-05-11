import ChannelClaim from '../../domain/ChannelClaim'
import * as backend from '../backend'
import { ThunkAction } from 'redux-thunk'
import { Action, AnyAction } from 'redux'

export const SET_CHANNELS = 'CHANNELS/SET'
export const SET_CLOSE_CHANNEL_CLAIM_STATE = 'CHANNELS/SET_CLOSE_CHANNEL_CLAIM_STATE'

export interface Channel {
  state: number
  spent: string
  value: string
  channelId: string
  receiver: string
  sender: string
}

export interface ChannelsState {
  channels: Channel[]
}

export interface SetChannelAction extends Action {
  payload: Channel[]
}

export interface ClaimState {
  claimState: ClaimState
}

export interface CloseChannelClaimAction extends Action {
  payload: ChannelClaim
}

function getInitialState (): ChannelsState {
  return {
    channels: []
  }
}

export function setChannels (channels: Channel[]): SetChannelAction {
  return {
    payload: channels,
    type: SET_CHANNELS
  }
}

export function setCloseChannelClaim (claimState: ChannelClaim): CloseChannelClaimAction {
  return {
    payload: claimState,
    type: SET_CLOSE_CHANNEL_CLAIM_STATE
  }
}

function reduceSetChannels (state: ChannelsState, channels: Channel[]): ChannelsState {
  return {
    ...state,
    channels
  }
}

export function fetchChannels (): ThunkAction<Promise<SetChannelAction>, ChannelsState, void> {
  return async (dispatch) => {
    const data = await backend.getJSON('/channels/')
    return dispatch(setChannels(data))
  }
}

export function closeChannel (channelId: string): ThunkAction<Promise<CloseChannelClaimAction>, ChannelClaim, void> {
  return async (dispatch) => {
    const data = await backend.getJSON(`/channels/${channelId}/close`)
    return dispatch(setCloseChannelClaim(data))
  }
}

export function reducer (state: ChannelsState, action: AnyAction): ChannelsState {
  if (!state) {
    return getInitialState()
  }

  switch (action.type) {
    case SET_CHANNELS:
      return reduceSetChannels(state, (action as SetChannelAction).payload)
    default:
      return state
  }
}

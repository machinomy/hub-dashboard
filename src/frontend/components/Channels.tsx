import * as React from 'react'
import { ActionCreator, Dispatch } from 'redux'
import camelToHuman from '../../util/camelToHuman'
import { AppState } from '../state/store'
import { connect } from 'react-redux'
import bemify from '../../util/bemify'
import { Channel, fetchChannels, SetChannelAction } from '../state/channels'
import Amount from './Amount'
import isEmpty from '../../util/isEmpty'

const bem = bemify('channels')

export interface StateProps {
  channels: Channel[]
}

export interface DispatchProps {
  fetchChannels: ActionCreator<Promise<SetChannelAction>>
}

export interface ChannelsProps extends StateProps, DispatchProps {
}

export interface ChannelsState {
  isLoading: boolean
}

const FIELDS = ['channelId', 'spent', 'value', 'sender', 'receiver', 'state']

const MONEY_RENDERER = (channel: Channel, field: string) => {
  return <Amount wei={(channel as any)[field]} />
}

interface FieldRenderer {
  [key: string]: (channel: Channel, field: string) => any
}

const FIELD_RENDERERS = {
  spent: MONEY_RENDERER,
  value: MONEY_RENDERER,
  _: (channel: Channel, field: string) => (channel as any)[field]
} as FieldRenderer

export class Channels extends React.Component<ChannelsProps, ChannelsState> {
  constructor (props: ChannelsProps) {
    super(props)

    this.state = {
      isLoading: true
    }
  }

  async componentDidMount () {
    await this.props.fetchChannels()

    this.setState({
      isLoading: false
    })
  }

  render () {
    return (
      <div className="container">
        <div className="row">
          <div className="col">
            <h1>All Channels</h1>
            {this.renderContent()}
          </div>
        </div>
      </div>
    )
  }

  renderContent () {
    if (this.state.isLoading) {
      return 'Loading...'
    }

    const headers = ['ID', 'Spent', 'Value', 'Sender', 'Receiver', 'State']

    return (
      <div className={bem('table')}>
        <table className="table table-striped">
          <thead>
          {this.renderTableHeader([...headers])}
          </thead>
          {this.renderTableBody()}
        </table>
      </div>
    )
  }

  renderTableHeader (headers: string[]) {
    if (isEmpty(this.props.channels)) {
      return (
        <tr key="header"/>
      )
    } else {
      return (
        <tr key="header">
          {headers.map((h: string) => {
            return <th key={h}>{camelToHuman(h)}</th>
          })}
        </tr>
      )
    }
  }

  renderTableBody () {
    if (isEmpty(this.props.channels)) {
      return (
        <tbody>
          <tr>
            <td>No channels found</td>
          </tr>
        </tbody>
      )
    } else {
      return (
        <tbody>
        {
          this.props.channels.map((c: Channel) => (
            <tr key={c.channelId}>
              {FIELDS.map((field: string) => <td key={field}>{FIELD_RENDERERS[field] ? FIELD_RENDERERS[field](c, field) : FIELD_RENDERERS._(c, field)}</td>)}
            </tr>
          ))
        }
        </tbody>
      )
    }
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    channels: state.channels.channels
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    fetchChannels: () => dispatch(fetchChannels())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channels)

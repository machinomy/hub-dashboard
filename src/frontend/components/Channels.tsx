import * as React from 'react'
import { ActionCreator, Dispatch } from 'redux'
import camelToHuman from '../../util/camelToHuman'
import { AppState } from '../state/store'
import { connect } from 'react-redux'
import bemify from '../../util/bemify'
import { Channel, fetchChannels, SetChannelAction, CloseChannelClaimAction, closeChannel } from '../state/channels'
import Amount from './Amount'
import isEmpty from '../../util/isEmpty'

const bem = bemify('channels')

export interface StateProps {
  channels: Channel[]
  address: string
}

export interface DispatchProps {
  fetchChannels: ActionCreator<Promise<SetChannelAction>>,
  closeChannel: ActionCreator<Promise<CloseChannelClaimAction>>,
}

export interface OwnProps {
  address: string
}

export interface ChannelsProps extends OwnProps, StateProps, DispatchProps {
}

export interface ChannelsState {
  isLoading: boolean,
  channelToClose: Channel | undefined
}

const FIELDS = ['channelId', 'spent', 'value', 'sender', 'state', 'lastPayment']

const MONEY_RENDERER = (channel: Channel, field: string) => {
  return <Amount wei={(channel as any)[field]} />
}

const STATE_RENDERER = (channel: Channel, field: string) => {
  switch ((channel as any)[field]) {
    case 0: return <span className="channels__table-state-cell-text_open">Open</span>
    case 1: return <span className="channels__table-state-cell-text_settling">Settling</span>
    case 2: return <span className="channels__table-state-cell-text_settled">Settled</span>
    default: return ''
  }
}

const DATETIME_RENDERER = (channel: Channel, field: string) => {
  return (channel as any)[field] ? new Date((channel as any)[field]).toLocaleString() : 'never'
}

const LAST_PAYMENT_RENDERER = (channel: Channel, field: string) => {
  return (channel as any)[field] ? new Date((channel as any)[field]['createdAt']).toLocaleString() : 'never'
}

interface FieldRenderer {
  [key: string]: (channel: Channel, field: string) => any
}

const FIELD_RENDERERS = {
  spent: MONEY_RENDERER,
  value: MONEY_RENDERER,
  state: STATE_RENDERER,
  createdAt: DATETIME_RENDERER,
  lastPayment: LAST_PAYMENT_RENDERER,
  _: (channel: Channel, field: string) => (channel as any)[field]
} as FieldRenderer

export class Channels extends React.Component<ChannelsProps, ChannelsState> {
  constructor (props: ChannelsProps) {
    super(props)

    this.state = {
      isLoading: true,
      channelToClose: undefined
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
      <div>
      <div className="container">
        <div className="row">
          <div className="col">
            <h1>All Channels</h1>
            {this.renderContent()}
          </div>
        </div>
      </div>
        <div className="modal fade" id="closeChannelModal" tabIndex={-1} role="dialog" aria-labelledby="closeChannelModal" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="closeChannelModal">Closing channel</h5>
                <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className="modal-body">
                Are you sure to close channel #{this.state.channelToClose ? this.state.channelToClose.channelId : ''} from {this.state.channelToClose ? this.state.channelToClose.sender : ''}?
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-link" data-dismiss="modal" onClick={this.handleCloseChannelModalCancelClick.bind(this)}>Cancel</button>
                <button type="button" className="btn btn-danger" data-dismiss="modal" onClick={this.handleCloseChannelInModalClick.bind(this)}>Close channel</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderContent () {
    if (this.state.isLoading) {
      return 'Loading...'
    }

    const headers = ['ID', 'Spent', 'Value', 'Sender', 'State', 'Last Payment', '']

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
          this.revealedChannels().map(c => (
            <tr style={{ fontSize: '9pt' }} key={c.channelId}>
              {FIELDS.map((field: string) => <td key={field}><div title={FIELD_RENDERERS[field] ? FIELD_RENDERERS[field](c, field) : FIELD_RENDERERS._(c, field)} className={bem('channel-field', field)}>{FIELD_RENDERERS[field] ? FIELD_RENDERERS[field](c, field) : FIELD_RENDERERS._(c, field)}</div></td>)}
              <td style={{ fontSize: '9pt' }} key={c.channelId}>
                <button hidden={c.state !== 0} type="button" className="btn btn-danger" data-toggle="modal" data-target="#closeChannelModal" onClick={this.handleCloseChannelInTableClick(c)}>
                  Close
                </button>
              </td>
              </tr>
          ))
        }
        </tbody>
      )
    }
  }

  revealedChannels (): Array<Channel> {
    let all = this.props.channels.slice(0).reverse()
    return all.filter(channel => channel.receiver === this.props.address)
  }

  handleCloseChannelInTableClick (channel: Channel) {
    return (e: any) => {
      this.setState({ ...this.state, channelToClose: channel })
    }
  }

  handleCloseChannelInModalClick (e: Event) {
    if (this.state.channelToClose) {
      this.props.closeChannel(this.state.channelToClose.channelId)
    }
  }

  handleCloseChannelModalCancelClick (e: Event) {
    this.setState({ ...this.state, channelToClose: undefined })
  }
}

function mapStateToProps (state: AppState, ownProps: OwnProps): StateProps {
  return {
    channels: state.channels.channels,
    address: ownProps.address
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    fetchChannels: () => dispatch(fetchChannels()),
    closeChannel: (channelId: string) => dispatch(closeChannel(channelId))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Channels)

import * as React from 'react'
import { connect } from 'react-redux'
import { AppState } from '../state/store'
import { ActionCreator, Dispatch } from 'redux'
import {
  fetchGlobalSettings,
  SetGlobalSettingsAction,
  togglePaymentsEnabled,
  ToggleSettingAction,
  toggleWithdrawalsEnabled
} from '../state/globalSettings'
import GlobalSettings from '../../domain/GlobalSettings'

export interface StateProps {
  globalSettings: GlobalSettings
}

export interface DispatchProps {
  toggleWithdrawalsEnabled: ActionCreator<Promise<ToggleSettingAction>>
  togglePaymentsEnabled: ActionCreator<Promise<ToggleSettingAction>>
  fetchGlobalSettings: ActionCreator<Promise<SetGlobalSettingsAction>>
}

export interface GlobalSettingsProps extends StateProps, DispatchProps {
}

export interface GlobalSettingsState {
  isLoading: boolean
}

export class GlobalSettingsView extends React.Component<GlobalSettingsProps, GlobalSettingsState> {
  constructor (props: GlobalSettingsProps) {
    super(props)

    this.state = {
      isLoading: true
    }
  }

  async componentDidMount () {
    await this.props.fetchGlobalSettings()

    this.setState({
      isLoading: false
    })
  }

  toggleWithdrawalsEnabled (e: MouseEvent, status: boolean) {
    e.preventDefault()
    this.props.toggleWithdrawalsEnabled(status)
  }

  togglePaymentsEnabled (e: MouseEvent, status: boolean) {
    e.preventDefault()
    this.props.togglePaymentsEnabled(status)
  }

  render () {
    return (
      <div className="container">
        <div className="row">
          <div className="col">
            <h1>Global Settings</h1>
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

    return (
      <form>
        <div className="form-group row">
          <label className="col-sm-2">Withdrawals:</label>
          <div className="btn-group col-sm-10">
            <button className="btn btn-primary" disabled={this.props.globalSettings.withdrawalsEnabled} onClick={(e: any) => this.toggleWithdrawalsEnabled(e, true)}>
              On
            </button>
            <button className="btn btn-primary" disabled={!this.props.globalSettings.withdrawalsEnabled} onClick={(e: any) => this.toggleWithdrawalsEnabled(e, false)}>
              Off
            </button>
          </div>
        </div>
        <div className="form-group row">
          <label className="col-sm-2">Payments:</label>
          <div className="btn-group col-sm-10">
            <button className="btn btn-primary" disabled={this.props.globalSettings.paymentsEnabled} onClick={(e: any) => this.togglePaymentsEnabled(e, true)}>
              On
            </button>
            <button className="btn btn-primary" disabled={!this.props.globalSettings.paymentsEnabled} onClick={(e: any) => this.togglePaymentsEnabled(e, false)}>
              Off
            </button>
          </div>
        </div>
      </form>
    )
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    globalSettings: state.globalSettings
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    toggleWithdrawalsEnabled: (status: boolean) => dispatch(toggleWithdrawalsEnabled(status)),
    togglePaymentsEnabled: (status: boolean) => dispatch(togglePaymentsEnabled(status)),
    fetchGlobalSettings: () => dispatch(fetchGlobalSettings())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(GlobalSettingsView)

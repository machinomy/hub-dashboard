import * as React from 'react'
import { Redirect, Route, RouteComponentProps, Switch, withRouter } from 'react-router'
import { connect } from 'react-redux'
import { AppState } from '../state/store'
import { ActionCreator, Dispatch } from 'redux'
import { checkStatus, SetAddressAction } from '../state/login'
import Payments from './Payments'
import Masthead from './Masthead'
import Channels from './Channels'
import GlobalSettings from './GlobalSettings'

export interface StateProps {
  address: string | null
}

export interface DispatchProps {
  checkStatus: ActionCreator<Promise<SetAddressAction>>
}

export interface AuthenticatedProps extends StateProps, DispatchProps, RouteComponentProps<any> {}

export interface AuthenticatedState {
  isLoading: boolean
}

export class Authenticated extends React.Component<AuthenticatedProps, AuthenticatedState> {
  constructor (props: AuthenticatedProps) {
    super(props)

    this.state = {
      isLoading: true
    }
  }

  async componentDidMount () {
    await this.props.checkStatus()

    this.setState({
      isLoading: false
    })
  }

  render () {
    if (this.state.isLoading) {
      return this.renderLoading()
    }

    if (!this.props.address) {
      return <Redirect to="/admin/login" />
    }

    return (
      <div id="authenticated">
        <Masthead />
        <Switch>
          <Route exact={true} path="/admin" render={() => <Redirect to="/admin/payments" />} />
          <Route path="/admin/payments" render={() => <Payments />} />
          <Route path="/admin/channels" render={() => <Channels />} />
          <Route path="/admin/global-settings" render={() => <GlobalSettings />} />
        </Switch>
      </div>
    )
  }

  renderLoading () {
    return (
      <div>
        Loading...
    </div>
    )
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    address: state.login.address
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    checkStatus: () => dispatch(checkStatus())
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Authenticated) as any)

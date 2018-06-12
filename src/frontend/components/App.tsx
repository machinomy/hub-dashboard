import * as React from 'react'
import { Route, Switch, Redirect } from 'react-router'
import Login from './Login'
import Authenticated from './Authenticated'
import { pollWeb3, SetWeb3StatusAction, Web3Status } from '../state/web3'
import { ActionCreator, Dispatch } from 'redux'
import { connect } from 'react-redux'
import { AppState } from '../state/store'
import { checkEthUsdRate, SetEthUsdRateAction } from '../state/units'

export interface StateProps {
  web3Status: Web3Status
}

export interface DispatchProps {
  pollWeb3: ActionCreator<Promise<SetWeb3StatusAction>>,
  checkEthUsdRate: ActionCreator<Promise<SetEthUsdRateAction>>
}

export interface AppProps extends StateProps, DispatchProps {
  Router: any
}

export class App extends React.Component<AppProps, {}> {
  async componentDidMount () {
    const status = await this.props.pollWeb3()

    if (status.payload === Web3Status.FOUND) {
      await this.props.checkEthUsdRate()
    }
  }

  render () {
    const Router = this.props.Router as typeof React.Component

    if (this.props.web3Status !== Web3Status.FOUND) {
      return this.renderLoadingWeb3()
    }

    return (
      <Router>
        <div id="app">
          <Switch>
            <Route exact={true} path="/admin/login" render={() => <Login />} />
            <Route path="/admin" render={() => <Authenticated />} />
          </Switch>
          <Redirect from="/" to="/admin" exact={true} />
        </div>
      </Router>
    )
  }

  renderLoadingWeb3 () {
    return (
      <div className="container-fixed">
        <div className="row justify-content-center">
          <div className="col-4">
            <div className="card mt-5">
              <div className="card-body text-center">
                <p className="my-0">
                  {
                    this.props.web3Status === Web3Status.CHECKING ?
                      'Checking for web3...' :
                      'Web3 not found. Please use a browser that supports web3, such as Google Chrome with MetaMask installed.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    web3Status: state.web3.status
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    pollWeb3: () => dispatch(pollWeb3()),
    checkEthUsdRate: () => dispatch(checkEthUsdRate())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(App)

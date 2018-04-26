import * as React from 'react'
import { connect } from 'react-redux'
import { ActionCreator, Dispatch } from 'redux'
import { login, SetAddressAction } from '../state/login'
import { AppState } from '../state/store'
import { RouteComponentProps, withRouter } from 'react-router'

export interface StateProps {
  address: string | null
}

export interface DispatchProps {
  login: ActionCreator<Promise<SetAddressAction>>
}

export interface LoginProps extends StateProps, DispatchProps, RouteComponentProps<any> {}

export interface LoginState {
  isLoading: boolean
}

export class Login extends React.Component<LoginProps, LoginState> {
  constructor (props: LoginProps) {
    super(props)

    this.state = {
      isLoading: false
    }
  }

  async onLoginClick () {
    this.setState({
      isLoading: true
    })

    try {
      await this.props.login()
      this.props.history.push('/admin/payments')
    } catch (e) {
      console.error(e)
      this.setState({
        isLoading: false
      })
    }
  }

  render () {
    return (
      <div className="container-fixed">
        <div className="row justify-content-center">
          <div className="col-4">
            <div className="card mt-5">
              <div className="card-body text-center">
                <p>Please use your MetaMask account to sign in.</p>
                {this.renderButton()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  renderButton () {
    if (this.state.isLoading) {
      return (
        <button className="btn btn-lg btn-primary" disabled={true}>
          Opening MetaMask...
        </button>
      )
    }

    return (
      <button className="btn btn-lg btn-primary" onClick={() => this.onLoginClick()}>
        Sign In With MetaMask
      </button>
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
    login: () => dispatch(login())
  }
}

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Login) as any)

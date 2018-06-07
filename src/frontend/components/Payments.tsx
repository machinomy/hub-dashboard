import * as React from 'react'
import isEmpty from '../../util/isEmpty'
import { EnrichedPayment, fetchPayments, SetPaymentAction } from '../state/payments'
import { ActionCreator, Dispatch } from 'redux'
import { AppState } from '../state/store'
import { connect } from 'react-redux'
import bemify from '../../util/bemify'
import Amount from './Amount'
import camelToHuman from '../../util/camelToHuman'

const bem = bemify('payments')

export interface StateProps {
  payments: EnrichedPayment[]
}

export interface DispatchProps {
  fetchPayments: ActionCreator<Promise<SetPaymentAction>>
}

export interface PaymentsProps extends StateProps, DispatchProps {}

export interface PaymentsState {
  isLoading: boolean
}

export class Payments extends React.Component<PaymentsProps, PaymentsState> {
  constructor (props: PaymentsProps) {
    super(props)

    this.state = {
      isLoading: true
    }
  }

  async componentDidMount () {
    await this.props.fetchPayments()

    this.setState({
      isLoading: false
    })
  }

  render () {
    return (
      <div className="container">
        <div className="row">
          <div className="col">
            <h1>Payments</h1>
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

    const headers = ['channelId', 'sender', 'price', 'value', 'channelValue', 'meta', 'createdAt']

    return (
      <div className={bem('table')}>
        <table className="table table-striped">
          <thead>
          {this.renderTableHeader([...headers])}
          </thead>
          {this.renderTableBody(headers)}
        </table>
      </div>
    )
  }

  renderTableHeader (headers: string[]) {
    if (isEmpty(this.props.payments)) {
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

  renderTableBody (paymentKeys: string[]) {
    if (isEmpty(this.props.payments)) {
      return (
        <tbody>
        <tr>
          <td>No payments found</td>
        </tr>
        </tbody>
      )
    } else {
      return (
        <tbody>
        {
          this.props.payments.slice(0).reverse().map((payment: any) => (
            <tr style={{ fontSize: '9pt' }} key={payment.token}>
              {paymentKeys.map((k: string) => this.renderPaymentKey(payment, k))}
            </tr>
          ))
        }
        </tbody>
      )
    }
  }

  private renderPaymentKey (payment: any, k: string) {
    if (k === 'price' || k === 'value' || k === 'channelValue') {
      return (
        <td key={k}>
          <div className={bem('payment-field', k)}><Amount wei={payment[k]} /></div>
        </td>
      )
    } else if (k === 'createdAt') {
      return (
        <td key={k}>
          <div className={bem('payment-field', k)}>{new Date(payment[k]).toLocaleString()}</div>
        </td>
      )
    }

    return (
      <td key={k}><div title={payment[k]} className={bem('payment-field', k)}>{payment[k]}</div></td>
    )
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    payments: state.payments.payments
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    fetchPayments: () => dispatch(fetchPayments())
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Payments)

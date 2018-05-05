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
            <h1>All Payments</h1>
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

    const headers = ['ChannelId', 'Kind', 'Token', 'Sender', 'Receiver',
      'Price', 'Value', 'ChannelValue', 'v', 'r', 's', 'Meta', 'ContractAddress',
      'CreatedAt', 'Exchange Rate ID', 'Withdrawal ID']

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
          this.props.payments.map((payment: any) => (
            <tr key={payment.payment.token}>
              {paymentKeys.map((k: string) => this.renderPaymentKey(payment, k))}
            </tr>
          ))
        }
        </tbody>
      )
    }
  }

  private renderPaymentKey (payment: any, k: string) {
    if (k === 'price') {
      return (
        <td key={k}>
          <div className={bem('payment-field', k)}><Amount wei={payment.payment[k]} /></div>
        </td>
      )
    }

    return (
      <td key={k}><div className={bem('payment-field', k)}>{payment.payment[k]}</div></td>
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

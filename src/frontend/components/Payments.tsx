import * as React from 'react'
import { EnrichedPayment, fetchPayments, SetPaymentAction } from '../state/payments'
import { ActionCreator, Dispatch } from 'redux'
import { AppState } from '../state/store'
import { connect } from 'react-redux'
import camelToHuman from '../../util/camelToHuman'
import bemify from '../../util/bemify'
import Amount from './Amount'

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

    const keys = this.extractKeys(this.props.payments[0])
    const otherKeys = keys[0]
    const paymentKeys = keys[1]

    return (
      <div className={bem('table')}>
        <table className="table table-striped">
          <thead>
          {this.renderTableHeader([...otherKeys, ...paymentKeys])}
          </thead>
          <tbody>
          {this.renderTableBody(otherKeys, paymentKeys)}
          </tbody>
        </table>
      </div>
    )
  }

  renderTableHeader (keys: string[]) {
    return (
      <tr key="header">
        {keys.map((k: string) => {
          return <th key={k}>{camelToHuman(k)}</th>
        })}
      </tr>
    )
  }

  renderTableBody (otherKeys: string[], paymentKeys: string[]) {
    return this.props.payments.map((payment: any) => {
      return (
        <tr key={payment.payment.token}>
          {otherKeys.map((k: string) => <td key={k}><div className={bem('other-field', k)}>{payment[k]}</div></td>)}
          {paymentKeys.map((k: string) => this.renderPaymentKey(payment, k))}
        </tr>
      )
    })
  }

  private extractKeys (payment: EnrichedPayment) {
    return Object.keys(payment).reduce((acc: string[][], k: string) => {
      if (k === 'payment') {
        Object.keys(payment[k]!).forEach((pk: string) => acc[1].push(pk))
      } else {
        acc[0].push(k)
      }

      return acc
    }, [[], []])
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

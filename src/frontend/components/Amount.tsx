import * as React from 'react'
import { connect } from 'react-redux'
import { Unit } from '../state/units'
import * as BigNumber from 'bignumber.js'
import { AppState } from '../state/store'
import w3 from '../web3'

export interface StateProps {
  activeUnit: Unit
  ethUsdRate: BigNumber.BigNumber
}

export interface AmountProps extends StateProps {
  wei: string | BigNumber.BigNumber
  displayUnit?: boolean
}

export class Amount extends React.Component<AmountProps, {}> {
  static defaultProps = {
    displayUnit: true
  }

  w3: any

  constructor (props: AmountProps) {
    super(props)
    this.w3 = w3()
  }

  render () {
    const amount = new BigNumber.BigNumber(this.props.wei)
    let content

    switch (this.props.activeUnit) {
      case Unit.WEI:
        content = amount.toString()
        break
      case Unit.ETH:
        content = this.w3.fromWei(amount, 'ether').toString()
        break
      case Unit.USD:
        content = this.calculateUsd(amount)
        break
    }

    return this.appendUnit(content)
  }

  private calculateUsd (amount: BigNumber.BigNumber) {
    const ether: BigNumber.BigNumber = this.w3.fromWei(amount, 'ether')
    return ether.mul(this.props.ethUsdRate).toString()
  }

  private appendUnit (content: string) {
    if (!this.props.displayUnit) {
      return content
    }

    if (this.props.activeUnit === Unit.USD) {
      return `$ ${content}`
    }

    return `${content} ${Unit[this.props.activeUnit]}`
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    activeUnit: state.units.activeUnit,
    ethUsdRate: state.units.ethUsdRate
  }
}

export default connect(mapStateToProps)(Amount)

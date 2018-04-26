import * as React from 'react'
import { connect } from 'react-redux'
import { AppState } from '../state/store'
import { ActionCreator, Dispatch } from 'redux'
import { setActiveUnit, SetActiveUnitAction, Unit } from '../state/units'
import classNames = require('classnames')

export interface StateProps {
  unit: Unit
}

export interface DispatchProps {
  setActiveUnit: ActionCreator<SetActiveUnitAction>
}

export interface UnitsDropdownProps extends StateProps, DispatchProps {}

export class UnitsDropdown extends React.Component<UnitsDropdownProps, {}> {
  render () {
    return (
      <ul className="navbar-nav">
        <li className="nav-item dropdown pull-right">
          <a href="#" className="nav-link dropdown-toggle" data-toggle="dropdown" id="units-dropdown">
            Units: <strong>{Unit[this.props.unit]}</strong>
          </a>
          <div className="dropdown-menu">
            <a href="#" className={this.itemClassNames(Unit.WEI)} onClick={(e: any) => this.setActiveUnit(e, Unit.WEI)}>
              Wei
            </a>
            <a href="#" className={this.itemClassNames(Unit.ETH)} onClick={(e: any) => this.setActiveUnit(e, Unit.ETH)}>
              ETH
            </a>
            <a href="#" className={this.itemClassNames(Unit.USD)} onClick={(e: any) => this.setActiveUnit(e, Unit.USD)}>
              USD
            </a>
          </div>
        </li>
      </ul>
    )
  }

  private itemClassNames (unit: Unit): string {
    return classNames('dropdown-item', {
      active: unit === this.props.unit
    })
  }

  private setActiveUnit (e: Event, unit: Unit) {
    e.preventDefault()
    this.props.setActiveUnit(unit)
  }
}

function mapStateToProps (state: AppState): StateProps {
  return {
    unit: state.units.activeUnit
  }
}

function mapDispatchToProps (dispatch: Dispatch<any>): DispatchProps {
  return {
    setActiveUnit: (unit: Unit) => dispatch(setActiveUnit(unit))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(UnitsDropdown)

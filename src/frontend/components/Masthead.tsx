import * as React from 'react'
import UnitsDropdown from './UnitsDropdown'
import { Route } from 'react-router'
import { Link } from 'react-router-dom'
import * as classnames from 'classnames'

const CustomLink = ({ to, children }: { to: string, children: any }) => {
  return (
    <Route
      path={to}
      exact={true}
      children={
        ({ match }) => {
          const names = classnames('nav-item', {
            active: !!match
          })
          return (
            <li className={names}>
              <Link to={to} className="nav-link">{children}</Link>
            </li>
          )
        }}
    />
  )
}

export default class Masthead extends React.Component<{}, {}> {
  render () {
    let navStyle = {
      backgroundColor: '#de5080'
    }
    return (
      <nav className="navbar navbar-expand-lg navbar-light" style={navStyle}>
        <div className="container">
          <a href="#" className="navbar-brand">Hub Dashboard</a>
          <button className="navbar-toggler" data-toggle="collapse" data-target="#navbar">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbar">
            <ul className="navbar-nav mr-auto">
              <CustomLink to="/admin/payments">
                Payments
              </CustomLink>
              <CustomLink to="/admin/channels">
                Channels
              </CustomLink>
            </ul>
            <UnitsDropdown />
          </div>
        </div>
      </nav>
    )
  }
}

import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import store from './state/store'
import App from './components/App'
import { BrowserRouter } from 'react-router-dom'

require('../frontend/styles/index.scss')

ReactDOM.render(
  <Provider store={store}>
    <App Router={BrowserRouter} />
  </Provider>,
  document.getElementById('root')
)

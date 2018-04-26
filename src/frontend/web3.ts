const Web3 = require('web3')

let w3: any = null

window.addEventListener('load', () => {
  if (global.hasOwnProperty('web3')) {
    w3 = new Web3((global as any).web3.currentProvider)
  }
})

export default () => w3

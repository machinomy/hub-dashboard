import vynos from 'vynos'

const Web3 = require('web3')

let w3: any = null
vynos.ready().then(wallet => w3 = new Web3(wallet.provider))

window.addEventListener('load', async () => {
  window.addEventListener('vynos.show', async (e: any) => {
    await vynos.display()
  }, false)
  await vynos.display()
})

export default () => w3

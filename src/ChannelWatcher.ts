import Machinomy from 'machinomy'
import log from './util/log'
import { Unidirectional } from '@machinomy/contracts'
import { EventEmitter } from 'events'
import { PaymentChannel } from 'machinomy/dist/lib/payment_channel'
import PaymentsDao from './dao/PaymentsDao'

const LOG = log('ChannelWatcher')

export default class ChannelWatcher extends EventEmitter {
  private started: boolean = false

  private machinomy: Machinomy

  private paymentsDao: PaymentsDao

  private web3: any

  private contract: Unidirectional.Contract | undefined

  constructor (machinomy: Machinomy, paymentsDao: PaymentsDao, web3: any) {
    super()
    this.machinomy = machinomy
    this.paymentsDao = paymentsDao
    this.web3 = web3
  }

  public async start () {
    if (this.started) {
      throw new Error('Already started.')
    }

    LOG.info('Starting channel watcher.')

    this.contract = await Unidirectional.contract(this.web3.currentProvider).deployed()
    this.started = true
  }

  public async stop () {
    this.started = false
  }

  public async closeSettlingChannels () {
    LOG.info('Closing settling channels.')
    const channels = await this.machinomy.settlingChannels()

    if (channels.length) {
      try {
        await Promise.all(channels.map((chan: PaymentChannel) => this.processSettlingChannel(chan)))
      } catch (err) {
        LOG.error('Failed to process settling channels: {err}', {
          err
        })
      }
    } else {
      LOG.info('No open channels found.')
    }

    const staleChannels = await this.paymentsDao.staleChannels()

    if (!staleChannels.length) {
      LOG.info('No stale channels found.')
      return
    }

    try {
      await Promise.all(staleChannels.map((chan: PaymentChannel) => this.processStaleChannel(chan)))
    } catch (err) {
      LOG.error('Failed to process stale channels: {err}', {
        err
      })
    }
  }

  private async processSettlingChannel (chan: PaymentChannel): Promise<boolean> {
    try {
      const channelId = chan.channelId

      LOG.info('Closing settling channel {channelId}.', {
        channelId
      })
      await this.machinomy.close(channelId)
      this.emit('didClose', channelId)
      return true
    } catch (err) {
      LOG.error('Failed to close settling channel: {err}', {
        err
      })
    }

    return false
  }

  private async processStaleChannel (chan: PaymentChannel): Promise<boolean> {
    try {
      const channelId = chan.channelId
      // tslint:disable-next-line:no-unnecessary-type-assertion
      const isOpen = await this.contract!.isOpen(channelId)
      // tslint:disable-next-line:no-unnecessary-type-assertion
      const isSettling = await this.contract!.isSettling(channelId)

      // need the below check because Machinomy merges the smart contract state with the database state.
      // since we're accessing the DB directly, we need to perform this check manually.
      if (!isOpen && !isSettling) {
        LOG.info('Channel with ID {channelId} is already closed.', {
          channelId
        })

        return false
      }

      LOG.info('Closing stale channel {channelId}', {
        channelId
      })

      await this.machinomy.close(channelId)
      this.emit('didClose', channelId)
      return true
    } catch (err) {
      LOG.error('Failed to close stale channel: {err}', {
        err
      })

      return false
    }
  }
}

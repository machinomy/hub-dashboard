import ChannelClaimsDao from '../dao/ChannelClaimsDao'
import ChannelClaim from '../domain/ChannelClaim'
import Machinomy from 'machinomy'
import log from '../util/log'

const LOG = log('ChannelClaimsService')

export default class ChannelClaimsService {
  private dao: ChannelClaimsDao

  private machinomy: Machinomy

  constructor (dao: ChannelClaimsDao, machinomy: Machinomy) {
    this.dao = dao
    this.machinomy = machinomy
  }

  byId (channelId: string): Promise<ChannelClaim | null> {
    return this.dao.byId(channelId)
  }

  async claim (channelId: string): Promise<ChannelClaim> {
    const claim = await this.dao.create(channelId)

    setImmediate(async () => {
      LOG.info('Starting claim process for channel {channelId}.', {
        channelId
      })

      try {
        await this.dao.markPending(channelId)
      } catch (err) {
        LOG.error('Failed to mark channel {channelId} as pending: {err}', {
          channelId,
          err
        })

        this.doFail(channelId)

        return
      }

      try {
        await this.machinomy.close(channelId)
      } catch (err) {
        LOG.error('Failed to claim channel {channelId}: {err}', {
          channelId,
          err
        })

        this.doFail(channelId)
        return
      }

      this.doConfirmed(channelId)
    })

    return claim
  }

  private doFail (channelId: string) {
    return this.dao.markFailed(channelId)
      .catch((err: any) => LOG.error('Failed to mark channel claim {channelId} as failed: {err}', {
        channelId,
        err
      }))
  }

  private doConfirmed (channelId: string) {
    return this.dao.markConfirmed(channelId)
      .catch((err: any) => {
        LOG.error('Failed to mark channel claim {channelId} as confirmed: {err}', {
          channelId,
          err
        })
        return this.doFail(channelId)
      })
  }
}

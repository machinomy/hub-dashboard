import * as express from 'express'
import { ApiService } from './ApiService'
import Machinomy from 'machinomy'
import { PaymentChannel, PaymentChannelSerde } from 'machinomy/dist/lib/payment_channel'
import log from '../util/log'
import { Role } from '../Role'
import ChannelClaimsService from '../service/ChannelClaimsService'
// tslint:disable-next-line:no-unused-variable
import channelClaimToJson, { ChannelClaimStatus } from '../domain/ChannelClaim'

const LOG = log('ChannelsApiService')

export default class ChannelsApiService implements ApiService {
  namespace = 'channels'

  router: express.Router = express.Router()

  machinomy: Machinomy

  private claimService: ChannelClaimsService

  constructor (machinomy: Machinomy, claimService: ChannelClaimsService) {
    this.machinomy = machinomy
    this.claimService = claimService

    this.doOpenChannels = this.doOpenChannels.bind(this)
    this.doClaimStatus = this.doClaimStatus.bind(this)
    this.doCloseChannel = this.doCloseChannel.bind(this)
    this.setupRoutes()
  }

  private async doOpenChannels (req: express.Request, res: express.Response) {
    if (!req.session!.roles.has(Role.ADMIN)) {
      return res.sendStatus(403)
    }

    let channels

    try {
      channels = await this.machinomy.channels()
    } catch (err) {
      LOG.error('Failed to fetch channels: {err}', {
        err
      })

      return res.sendStatus(500)
    }

    channels.map((channel: PaymentChannel) => {
      delete channel.receiver
    })

    res.send(channels.map(PaymentChannelSerde.instance.serialize.bind(PaymentChannelSerde.instance)))
  }

  private async doClaimStatus (req: express.Request, res: express.Response) {
    const channelId = req.params.channelId

    if (!channelId) {
      res.sendStatus(400)
      return undefined
    }

    try {
      const claim = await this.claimService.byId(channelId)

      if (!claim) {
        res.send({
          channelId: channelId,
          status: null,
          createdAt: null,
          pendingAt: null,
          confirmedAt: null,
          failedAt: null
        })
        return undefined
      }

      return res.send(channelClaimToJson(claim))
    } catch (err) {
      LOG.error('Failed to fetch claim status for {channelId}: {err}', {
        channelId,
        err
      })
      res.sendStatus(500)
    }
  }

  private async doCloseChannel (req: express.Request, res: express.Response) {
    const channelId = req.params.channelId
    let channel

    try {
      channel = await this.machinomy.channelById(channelId)
    } catch (e) {
      LOG.error('Failed to get channel {channelId}: {e}', {
        channelId,
        e
      })
      return res.sendStatus(500)
    }

    if (!channel) {
      LOG.info('No channel with id {channelId} found', {
        channelId
      })
      return res.sendStatus(400)
    }

    if (!req.session!.roles.has(Role.ADMIN) && channel.sender !== req.session!.address) {
      LOG.info('Invalid sender {sender} for channelId {channelId}', {
        sender: channel.sender,
        channelId
      })
      return res.sendStatus(403)
    }

    LOG.info('Closing channel with id {channelId} on behalf of sender {sender}', {
      channelId,
      sender: channel.sender
    })

    try {
      const claim = await this.claimService.claim(channelId)
      return res.send(claim)
    } catch (e) {
      LOG.error('Failed to close channel {channelId}: {e}', {
        channelId,
        e
      })
      return res.sendStatus(500)
    }
  }

  private setupRoutes () {
    this.router.get('/', this.doOpenChannels)
    this.router.get('/:channelId/claimStatus', this.doClaimStatus)
    this.router.post('/:channelId/close', this.doCloseChannel)
  }
}

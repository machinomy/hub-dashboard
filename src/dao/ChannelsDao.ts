import DBEngine from '../DBEngine'
import { Client } from 'pg'
import { Unidirectional } from '@machinomy/contracts'

export default interface ChannelsDao {
  allOpenFor (address: string): Promise<string[]>
}

export class PostgresChannelsDao implements ChannelsDao {
  private client: DBEngine<Client>

  private web3: any

  private contract: Unidirectional.Contract | undefined

  constructor (client: DBEngine<Client>, web3: any) {
    this.client = client
    this.web3 = web3
  }

  allOpenFor (address: string): Promise<string[]> {
    return this.client.exec(async (c: Client) => {
      const res = await c.query(
        'SELECT "channelId" FROM channel WHERE sender = $1 AND state = 0',
        [
          address
        ]
      )

      if (!res.rows.length) {
        return []
      }

      const contract = await this.getContract()
      const out = []

      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows[i]
        const channelId = row.channelId
        const isOpen = await contract!.isOpen(channelId)

        if (isOpen) {
          out.push(channelId)
        }
      }

      return out
    })
  }

  private async getContract () {
    if (this.contract) {
      return this.contract
    }

    this.contract = await Unidirectional.contract(this.web3.currentProvider).deployed()
    return this.contract
  }
}

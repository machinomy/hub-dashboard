import WithdrawalsDao from '../dao/WithdrawalsDao'
import { default as Withdrawal, WithdrawalStatus } from '../domain/Withdrawal'
import { TotalsTuple } from '../dao/TipsDao'
import Config from '../Config'
import log from '../util/log'
import GlobalSettingsDao from '../dao/GlobalSettingsDao'

const LOG = log('WithdrawalsService')

export default class WithdrawalsService {
  private withdrawalsDao: WithdrawalsDao

  private globalSettingsDao: GlobalSettingsDao

  private web3: any

  private config: Config

  constructor (withdrawalsDao: WithdrawalsDao, globalSettingsDao: GlobalSettingsDao, web3: any, config: Config) {
    this.withdrawalsDao = withdrawalsDao
    this.globalSettingsDao = globalSettingsDao
    this.web3 = web3
    this.config = config
  }

  public async withdraw (address: string): Promise<Withdrawal> {
    const enabled = (await this.globalSettingsDao.fetch()).withdrawalsEnabled

    if (!enabled) {
      LOG.error('Blocking withdrawal attempt from {address} while withdrawals are disabled.', {
        address
      })
      throw new Error('Withdrawals are disabled.')
    }

    let wd: Withdrawal | null = null

    try {
      wd = await this.withdrawalsDao.create(address)
    } catch (err) {
      LOG.error('Failed to created withdrawal: {err}', {
        err
      })
    }

    if (!wd) {
      throw new Error('Failed to create withdrawal.')
    }

    this.web3.eth.sendTransaction({
      from: this.config.hotWalletAddress,
      to: address,
      value: wd.amountWei
    }, (err: any, txHash: string) => {
      if (err) {
        LOG.error('Failed to process withdrawal for address {address}: {err}', {
          address,
          err
        })

        return this.withdrawalsDao.markFailed(wd!.id)
          .catch((err) => LOG.error('Failed to mark withdrawal for address {address} as failed: {err}', {
            address,
            err
          }))
      }

      this.withdrawalsDao.markPending(wd!.id, txHash).then(() => this.pollStatus(wd!.id, txHash)).catch((err) => {
        LOG.error('Failed to mark withdrawal for address {address} as pending: {err}', {
          address,
          err
        })

        return this.withdrawalsDao.markFailed(wd!.id).catch(() => LOG.error('Failed to mark withdrawal for address {address} as failed: {err}', {
          address,
          err
        }))
      })
    })

    return wd
  }

  public totalFor (address: string, status: WithdrawalStatus): Promise<TotalsTuple> {
    return this.withdrawalsDao.totalFor(address, status)
  }

  public allFor (address: string): Promise<Withdrawal[]> {
    return this.withdrawalsDao.allFor(address)
  }

  /**
   * Continually polls the blockchain for the confirmation status of the given transaction.
   * Marks the transaction's withdrawal as either failed (upon timeout) or confirmed (upon
   * confirmation).
   *
   * @param {number} wdId
   * @param {string} txHash
   */
  private pollStatus (wdId: number, txHash: string) {
    const maxAttempts = 120
    let attempt = 0

    const poll = () => {
      if (attempt === maxAttempts) {
        LOG.error('Withdrawal {wdId} with txhash {txHash} timed out.', {
          wdId,
          txHash
        })

        this.withdrawalsDao.markFailed(wdId).catch((err) => LOG.error('Failed to mark withdrawal {wdId} as failed: {err}', {
          wdId,
          err
        }))

        return
      }

      attempt++

      this.web3.eth.getTransaction(txHash, (err: any, res: any) => {
        LOG.info('Checking status of withdrawal {wdId} with txhash {txHash}.', {
          wdId,
          txHash
        })

        if (err) {
          LOG.error('Got error from Web3 while polling status for {wdId}: {err}', {
            wdId,
            err
          })

          setTimeout(poll, 1000)
          return
        }

        if (res.blockNumber === null) {
          LOG.info('Withdrawal {wdId} with tx hash {txHash} unconfirmed. Retrying. Attempt {attempt} of {maxAttempts}', {
            wdId,
            txHash,
            attempt,
            maxAttempts
          })

          setTimeout(poll, 1000)
          return
        }

        LOG.info('Withdrawal {wdId} with tx hash {txHash} has been confirmed.', {
          wdId,
          txHash
        })

        this.withdrawalsDao.markConfirmed(wdId).catch((err) => LOG.error('Failed to mark withdrawal {wdId} as confirmed: {err}', {
          wdId,
          err
        }))
      })
    }

    poll()
  }
}

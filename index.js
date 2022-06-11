import 'dotenv/config'

import {DEX} from './dex'
import {CEX} from './cex'
import {sleep} from './utils'
import {logger} from './log'
import {BEAM, COINS, GLMR, SIDE, STELLA} from './const'

class CDArbitrage {
  static LONG_DEX_SHORT_CEX = 0
  static SHORT_DEX_LONG_CEX = 1

  init (options={}) {
    this.dex = new DEX(options={})
    this.cex = new CEX(options={})
    this.symbol = options.symbol | 'GLMRUSDT'
    this.orderAmount = options.orderAmount | 700
    this.maxSlippage = options.maxSlippage | 0.999
    this.expectedSpread = options.expectedSpread | 0.00325
  }

  async run() {
    while (true) {
      try {
        let isSynced = await this.dex.isTransactionSynced()
        if (!isSynced) {
          logger.warn('Transaction pending, waiting')
          await sleep(1000)
          continue
        }

        let isEnough = await this.isBalanceEnough()
        if (!isEnough) {
          logger.error('Balance is not enough')
          await sleep(10 * 1000)
          continue
        }

        let self = this
        let flag, dexBestTrade, amount

        // 币安市价卖 GLMR 链上买 GLMR  GLMR 数量恒定  amount 是币安卖出 GLMR 所得的 USDT
        [flag, dexBestTrade, amount] = await this.checkSpread(this.symbol, CDArbitrage.LONG_DEX_SHORT_CEX)
        if (flag) {
          dexBestTrade(this.orderAmount, amount * this.maxSlippage).then(
            async (tx) => await self.trackTx(tx, SIDE.BUY, amount)
          )
          this.cex.order(this.symbol, SIDE.SELL, 'MARKET', this.orderAmount).then((o) => {
            logger.info('')
          })
          continue
        }

        // 币安 USDT 市价买 链上卖 GLMR   GLMR 数量恒定, USDT 估算, amount 是币安买 GLMR 所需要的 USDT
        [flag, dexBestTrade, amount] = await this.checkSpread(this.symbol, CDArbitrage.SHORT_DEX_LONG_CEX)
        if (flag) {
          dexBestTrade(this.orderAmount, amount * this.maxSlippage).then(
            async (tx) => await self.trackTx(tx, SIDE.SELL, self.orderAmount)
          )
          this.cex.order(this.symbol, SIDE.BUY, 'MARKET', amount).then((o) => {
            logger.info('')
          })
          continue
        }

        // todo 记录订单到数据库，方便 bug 追踪和程序优化

        logger.info('no spread exits, continue...')
        await sleep(0.2 * 1000)
      } catch (e) {
        logger.error(e)
        await sleep(2 * 1000)
      }
    }
  }

  async checkSpread (symbol, direction) {
    let spread, best, amount
    if (direction === CDArbitrage.LONG_DEX_SHORT_CEX) {
      const [beamCost, stellaCost, cexGot] = await Promise.all([
        this.dex.getBeamBuyAmounts(this.orderAmount),
        this.dex.getStellaBuyAmounts(this.orderAmount),
        this.cex.getAverage(symbol, SIDE.SELL, this.orderAmount)
      ])
      const dexCost = beamCost >= stellaCost ? stellaCost : beamCost
      best = beamCost >= stellaCost ? this.dex.buyOnStella : this.dex.buyOnStella
      if (cexGot === 0) {
        return [false, null]
      }
      amount = cexGot
      spread = (cexGot - dexCost) / cexGot
    } else {
      // SHORT_DEX_LONG_CEX
      const [beamGot, stellaGot, cexCost] = await Promise.all([
        this.dex.getBeamSellAmounts(this.orderAmount),
        this.dex.getStellaSellAmounts(this.orderAmount),
        this.cex.getAverage(symbol, SIDE.BUY, this.orderAmount)
      ])
      const dexGot = beamGot >= stellaGot ? beamGot : stellaGot
      best = beamGot >= stellaGot ? this.dex.sellOnBeam : this.dex.sellOnStella
      if (cexCost === 0) {
        return [false, null]
      }
      amount = cexCost
      spread = (dexGot - cexCost) / dexGot
    }

    if (spread > this.expectedSpread) {
      return [true, best, amount]
    } else{
      return [false, null, null]
    }
  }

  async isBalanceEnough() {
    const [dexBalance, cexBalance] = await Promise.all([
      this.dex.balanceOf(COINS[GLMR]),
      this.cex.getBalance(GLMR)
    ])
    return (dexBalance >= 1000 && cexBalance >= 1000)
  }

  async trackTx(tx, side, amount) {
    try {
      await tx.wait()
      logger.debug(`Transaction execution succeed, tx: ${tx.hash}`)
    } catch (e) {
      // todo rollback the trade in cex
      logger.warn(`Transaction execution failed, rollback trade ${side} ${amount}, tx: ${tx.hash}`)
      await this.cex.order(this.symbol, side, amount)
    }
  }
}
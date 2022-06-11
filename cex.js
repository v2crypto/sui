import Binance from 'binance-api-node'

import {SIDE} from './const'

export class CEX {
  constructor(options={}) {
    this.client = Binance.default({
      apiKey: options.apiKey,
      apiSecret: options.apiSecret
    })
  }

  async getBalance(coin) {
    const info = await this.client.accountInfo()
    for (let i of info['balances']) {
      if (i['asset'] === coin) {
        return Number(coin['free'])
      }
    }
  }

  async getAverage (symbol, side, amount, depth=5) {
    // todo 通过 ws 维护本地的 order book
    const result = await this.client.book({ symbol, limit: depth})
    let orderBook, total=0, left=amount
    if (side === SIDE.BUY) { // asks
      orderBook = result['asks']
    } else { // bids
      orderBook = result['bids']
    }
    for (let item of orderBook) {
      let price = Number(item.price)
      let quantity = Number(item.quantity)
      if (left >= quantity) {
        total += price * quantity
      } else {
        total += price * left
      }
      left = left - quantity
    }

    // return 0 if not enough depth
    if (left > 0) {
      return 0
    } else {
      return total
    }
  }

  async order (symbol, side, type, quantity, price=null) {
    const params = {
      symbol,
      side,
      type,
      quantity,
      recvWindow: 1000,
    }
    if (type === 'LIMIT') {
      params['price'] = price
    }
    return await this.client.order(params)
  }
}
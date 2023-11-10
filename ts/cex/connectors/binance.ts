import to from "await-to-js";
import BinanceClient, { Bid, Binance, OrderSide, OrderType } from "binance-api-node";
import { CexConnector } from "../cex";
import { cexSettings } from "../../settings";
import { SIDE } from "../../const";
import logger from "../../log";

export class BinanceConnector implements CexConnector {
    private client: Binance;

    constructor() {
        this.client = BinanceClient({
            apiKey: cexSettings.binance.apiKey,
            apiSecret: cexSettings.binance.apiSecret,
            httpBase: cexSettings.binance.httpBase,
            wsBase: cexSettings.binance.wsBase,
        });
    }

    public async balanceOf(coin: string) {
        const [err, balances] = await to(this.client.accountInfo());
        if (err) {
            throw err;
        }
        const balance = balances.balances.find((b) => b.asset === coin);
        if (!balance) {
            return 0
        }
        return parseFloat(balance.free);
    }

    async getSystemStatus() {
        // TODO: get system status not exist in binance api
        return true;
    }

    async getOrderBook(symbol: string, depth=5) {
        return this.client.book({ symbol: symbol, limit: depth})
    }

    public async getTradeAmount(symbol: string, side: SIDE, amount: number, depth=5) {
        // todo 通过 ws 维护本地的 order book
        const orderBook = await this.client.book({ symbol, limit: depth})
        // todo 通过 ws 维护本地的 order book
        let bids: Bid[] =[], total=0, left=amount
        if (side === "BUY") { // asks
            bids = orderBook['asks'].reverse()
        } else { // bids
            bids = orderBook['bids']
        }
        for (let item of bids) {
          let price = Number(item.price)
          let quantity = Number(item.quantity)
          if (left >= quantity) {
            total += price * quantity
          } else {
            total += price * left
          }
          left = left - quantity
          if (left <= 0){
            return total
          }
        }
        // return 0 if not enough depth
        return 0
      }

    public async marketOrder(symbol: string, side: SIDE, amount: number) {
        const exchangeInfo = await this.client.exchangeInfo({ symbol })
        const filters = exchangeInfo.symbols[0].filters
        const lotSizeFilter: any = filters.find(f => f.filterType === 'LOT_SIZE')
        const stepSize = Number(lotSizeFilter.stepSize)
        let decimalCount = Math.abs(Math.log10(stepSize));

        const order = await this.client.orderTest({
            symbol,
            side: side as OrderSide,
            quantity: amount.toFixed(decimalCount),
            type: OrderType.MARKET,
            // recvWindow: 1000,
        });
        logger.info(`币安 market order ${side} ${amount} ${symbol} success`);
        logger.debug("币安下单详情", order)

        return order.orderId;
    }
}
import to from "await-to-js";
import BinanceClient, { Bid, Binance, OrderSide, OrderType } from "binance-api-node";
import { CexConnector } from "../cex";
import { cexSettings } from "../../settings";
import { SIDE } from "../../const";

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
            // throw new Error(`No balance of ${coin}`);
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
        symbol = "BTCUSDT"
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
        const order = await this.client.order({
            symbol,
            side: side as OrderSide.BUY,
            quantity: amount.toString(),
            type: OrderType.MARKET,
        });
        return order.orderId;
    }
}
import { Bid, OrderBook } from "binance-api-node";
import { SIDE } from "../const";

export interface CexConnector {
    balanceOf(coin: string): Promise<number>;
    getSystemStatus(): Promise<boolean>;
    getOrderBook(symbol: string, depth?: number): Promise<OrderBook>;
    getTradeAmount(symbol: string, side: SIDE, amount: number, depth?: number): Promise<number>;
    marketOrder(symbol: string, side: SIDE, amount: number): Promise<number>;
}

export class CexClient {
    strategy: CexConnector;
    constructor(strategy: CexConnector) {
        this.strategy = strategy;
    }

    async balanceOf(coin: string) {
        return this.strategy.balanceOf(coin);
    }

    async getSystemStatus() {
        return this.strategy.getSystemStatus();
    }

    async getOrderBook(symbol: string, depth=5) {
        return this.strategy.getOrderBook(symbol, depth);
    }

    async getTraveAmount(symbol: string, side: SIDE, amount: number, depth=5) {
        return this.strategy.getTradeAmount(symbol, side, amount, depth);
    }

    async marketOrder(symbol: string, side: SIDE, amount: number) {
        return this.strategy.marketOrder(symbol, side, amount);
    }
}
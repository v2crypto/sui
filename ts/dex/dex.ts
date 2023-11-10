import { SIDE } from "../const";
import { ERC20Token } from "../token/erc20";
import { TokenTrade, TransactionState } from "./connectors/uniswap";

export interface DexConnector {
    isTransactionSynced(): Promise<boolean>;
    getTradeAmount(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number): Promise<number>;
    marketOrder(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number): Promise<TransactionState>;
}

export class DexClient {
    strategy: DexConnector;
    constructor(strategy: DexConnector) {
        this.strategy = strategy;
    }

    async isTransactionSynced() {
        return this.strategy.isTransactionSynced();
    }

    async getTraveAmount(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number) {
        return this.strategy.getTradeAmount(tokenA, tokenB, side, amount);
    }

    async marketOrder(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number) {
        return this.strategy.marketOrder(tokenA, tokenB, side, amount);
    }
    
}
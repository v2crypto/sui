import { SIDE } from "../const";
import { ERC20Token } from "../token/erc20";
import { TokenTrade, TransactionState } from "./connectors/uniswap";

export interface DexConnector {
    isTransactionSynced(): Promise<boolean>;
    getTradeAmount(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number): Promise<number>;
    createTrade(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number): Promise<TokenTrade>;
    marketOrder(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number): Promise<TransactionState>;
}

export class DexClient {
    strategy: DexConnector;
    constructor(strategy: DexConnector) {
        this.strategy = strategy;
    }

    async isTransactionSynced() {
        return this.strategy.isTransactionSynced();
    }

    async getTraveAmount(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number) {
        return this.strategy.getTradeAmount(tokenIn, tokenOut, amount);
    }

    async createTrade(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number) {
        return this.strategy.createTrade(tokenIn, tokenOut, amount);
    }

    async marketOrder(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number) {
        return this.strategy.marketOrder(tokenIn, tokenOut, amount);
    }
    
}
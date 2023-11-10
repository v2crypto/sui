import { ERC20Token } from "../token/erc20";

export class Pair {
    constructor(public tokenA: ERC20Token, public tokenB: ERC20Token) {}

    getTokenA() {
        return this.tokenA
    }

    getTokenB() {
        return this.tokenB
    }

    getSymbol() {
        return `${this.tokenA.symbol}${this.tokenB.symbol}`
    }
}
import { CexClient } from "../cex/cex";
import { DexClient } from "../dex/dex";
import { ERC20Token } from "../token/erc20";
import { Wallet } from "ethers"

export class CDArbitrage {

    constructor(
        private cexClient: CexClient,
        private dexClient: DexClient,
        private tokenA: ERC20Token,
        private tokenB: ERC20Token,
        private wallet: Wallet,
    ) {}
    
    async isBalanceEnough(coin: string, amount: number) {
        const cexBalance = await this.cexClient.balanceOf(coin)
        const token = this.getToken(coin)
        const dexBalance = await token.balanceOf(this.wallet.address)
        return cexBalance >= amount && dexBalance >= amount
    }

    async isTradable() {
        const isTransactionSynced = await this.dexClient.isTransactionSynced()

        if (!isTransactionSynced) {
            return false
        }

        const CexSystemStatus = await this.cexClient.getSystemStatus()
        return CexSystemStatus
    }
    
    private getToken(coin: string) {
        if (this.tokenA.symbol === coin) {
            return this.tokenA
        } else if (this.tokenB.symbol === coin) {
            return this.tokenB
        } else {
            throw new Error("invalid coin")
        }
    }

    async getC2DSpreadAndAmount(symbol: string, orderAmount: number) {
        const got = await this.cexClient.getTraveAmount(symbol, "SELL", orderAmount)
        const cost = await this.dexClient.getTraveAmount(this.tokenA, this.tokenB, orderAmount)
        return [(got-cost)/got, got]
    }

    async getD2CSpreadAndAmount(symbol: string, orderAmount: number) {
        const cost = await this.cexClient.getTraveAmount(symbol, "BUY", orderAmount)
        const got = await this.dexClient.getTraveAmount(this.tokenB, this.tokenA, orderAmount)
        return [(got-cost)/got, got]
    }
}
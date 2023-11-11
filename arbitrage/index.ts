import { TradeType } from "@uniswap/sdk-core";
import { CexClient } from "../cex/cex";
import { DexClient } from "../dex/dex";
import logger from "../log";
import { Pair } from "../pair/pair";
import { ERC20Token } from "../token/erc20";
import { Wallet } from "ethers"
import { TransactionState } from "../dex/connectors/uniswap";

export class CDArbitrage {

    constructor(
        private cexClient: CexClient,
        private dexClient: DexClient,
        private wallet: Wallet,
    ) {}
    
    async isBalanceEnough(token: ERC20Token, amount: number) {
        const cexBalance = await this.cexClient.balanceOf(token.symbol)
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


    async getC2DSpreadAndAmount(expectedAmount: number, cPair: Pair, dPair: Pair) {
        const cost = await this.dexClient.getTraveAmount(dPair.tokenA, dPair.tokenB, "BUY", expectedAmount)
        logger.info("Dex估价" + `消耗${cost}数量的${dPair.tokenB.symbol}, 买入${expectedAmount}数量的${dPair.tokenA.symbol}`)
        const got = await this.cexClient.getTraveAmount(cPair.getSymbol(), "SELL", expectedAmount)
        logger.info("Cex估价" + `卖出${expectedAmount}数量的${cPair.tokenA.symbol}, 获得${got}数量的${cPair.tokenB.symbol}`)
        return [(got-cost)/got, cost, got]
    }

    async getD2CSpreadAndAmount(expectedAmount: number, cPair: Pair, dPair: Pair) {
        const got = await this.dexClient.getTraveAmount(dPair.tokenA, dPair.tokenB, "SELL", expectedAmount)
        logger.info("Dex估价" + `卖出${expectedAmount}数量的${dPair.tokenA.symbol}, 获得${got}数量的${dPair.tokenB.symbol}`)
        const cost = await this.cexClient.getTraveAmount(cPair.getSymbol(), "BUY", expectedAmount)
        logger.info("Cex估价" + `消耗${cost}数量的${cPair.tokenB.symbol}, 买入${expectedAmount}数量的${cPair.tokenA.symbol}`)
        return [(got-cost)/got, got, cost]
    }

    async C2DOrder(expectedAmount:number, orderAmount: number,  cPair: Pair, dPair: Pair, uPair?: Pair) {
        logger.info(`币安卖，Uniswap买` + `${cPair.tokenA.symbol}交易数量:${expectedAmount}`)
        await this.cexClient.marketOrder(cPair.getSymbol(), "SELL", expectedAmount);
        const tradeStatus = await this.dexClient.marketOrder(dPair.tokenA, dPair.tokenB, "BUY", expectedAmount);
        if (tradeStatus === TransactionState.Sent && uPair) {
            logger.info(`币安卖掉USDC` + `${uPair.tokenA.symbol}交易数量:${expectedAmount}`)
            await this.cexClient.marketOrder(uPair.getSymbol(), "SELL", expectedAmount);
        }
    
        if (tradeStatus === TransactionState.Failed) {
            logger.error("uniswap交易失败，重新交易")
            await this.cexClient.marketOrder(cPair.getSymbol(), "BUY", orderAmount);
        }
    }

    async D2COrder(expectedAmount:number, orderAmount: number,  cPair: Pair, dPair: Pair, uPair?: Pair) {
        logger.info(`Uniswap卖，币安买` + `${cPair.tokenA.symbol}交易数量:${expectedAmount}`)
        await this.cexClient.marketOrder(cPair.getSymbol(), "BUY", expectedAmount);
        const tradeStatus = await this.dexClient.marketOrder(dPair.tokenA, dPair.tokenB, "SELL", expectedAmount); 
        if (tradeStatus === TransactionState.Sent && uPair) {
            logger.info(`Uniswap买USDC` + `${uPair.tokenA.symbol}交易数量:${expectedAmount}`)
            await this.cexClient.marketOrder(uPair.getSymbol(), "BUY", expectedAmount);
        }

        if (tradeStatus === TransactionState.Failed) {
            logger.error("币安交易失败，重新交易")
            await this.dexClient.marketOrder(dPair.tokenA, dPair.tokenB, "BUY", orderAmount);
        }
    }
}
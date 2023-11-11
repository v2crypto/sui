import CetusClmmSDK, { TickMath, secretKeyToEd25519Keypair } from "@cetusprotocol/cetus-sui-clmm-sdk";
import { SIDE } from "../../const";
import { ERC20Token } from "../../token/erc20";
import { DexConnector } from "../dex";
import { TransactionState } from "./uniswap";
import { buildSdkOptions } from "./cetus-config";
import BN from "bn.js";
import Decimal from "decimal.js";

export class CetusConnector implements DexConnector {

    private sdk: CetusClmmSDK
    private uri: string

    constructor() {
        this.sdk = new CetusClmmSDK(buildSdkOptions())
        const keypair = secretKeyToEd25519Keypair("07c72599c04f6eda32b60e9664ee2eaecedd5d74d31ed1ee6a541348a49aeb71")
        this.sdk.senderAddress = keypair.getPublicKey().toSuiAddress()
    }

    async isTransactionSynced(): Promise<boolean> {
        return true
    }
    marketOrder(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number): Promise<TransactionState> {
        throw new Error("Method not implemented.");
    }

    async getTradeAmount(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number) {
        const tokenIn = side === "BUY" ? tokenB : tokenA
        const tokenOut = side === "BUY" ? tokenA : tokenB
        this.uri =  side === "BUY" ? '0x4eed0ec3402f2e728eec4d7f6c6649084f2aa243e13d585ac67e3bf81c34039b'
        :'0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3'
        const pool = await this.sdk.Pool.getPool(this.uri)  
        let price = TickMath.sqrtPriceX64ToPrice(new BN(pool.current_sqrt_price), tokenB.decimals, tokenA.decimals)
        if (side !== "SELL") {
            price = new Decimal(1).dividedBy(price)
        }
        return price.mul(amount).toNumber()
      }
}

export function printAggregatorResult(result: any) {
    const logLines: string[] = [
      `inputAmount: ${result.inputAmount}`,
      `outputAmount: ${result.outputAmount}`,
      `fromCoin: ${result.fromCoin}`,
      `toCoin: ${result.toCoin}`,
      `isExceed: ${result.isExceed ? 'true' : 'false'}`,
      `isTimeout: ${result.isTimeout ? 'true' : 'false'}`,
      `byAmountIn: ${result.byAmountIn ? 'true' : 'false'}`,
    ]
  
    result.splitPaths.forEach((splitPath: any, index: any) => {
      logLines.push(`splitPaths ${index + 1}:`)
      logLines.push(`  pathIndex ${splitPath.pathIndex}:`)
      logLines.push(`  lastQuoteOutput: ${splitPath.lastQuoteOutput}`)
      logLines.push(`  percent: ${splitPath.percent}`)
      logLines.push(`  inputAmount: ${splitPath.inputAmount}`)
      logLines.push(`  outputAmount: ${splitPath.outputAmount}`)
  
      splitPath.basePaths.forEach((basePath:any, basePathIndex: any) => {
        logLines.push(`  basePaths ${basePathIndex + 1}:`)
        logLines.push(`    direction: ${basePath.direction ? 'true' : 'false'}`)
        logLines.push(`    label: ${basePath.label}`)
        logLines.push(`    poolAddress: ${basePath.poolAddress}`)
        logLines.push(`    fromCoin: ${basePath.fromCoin}`)
        logLines.push(`    toCoin: ${basePath.toCoin}`)
        logLines.push(`    outputAmount: ${basePath.outputAmount}`)
        logLines.push(`    inputAmount: ${basePath.inputAmount}`)
        logLines.push(`    fee_rate: ${basePath.feeRate.toString()}`)
        logLines.push(`    current_sqrt_price: ${basePath.currentSqrtPrice}`)
        logLines.push(`    from_decimal: ${basePath.fromDecimal}`)
        logLines.push(`    to_decimal: ${basePath.toDecimal}`)
        logLines.push(`    currentPrice: ${basePath.currentPrice}`)
      })
    })
    console.log(logLines.join('\n'))
}
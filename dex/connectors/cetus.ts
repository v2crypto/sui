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
        const keypair = secretKeyToEd25519Keypair("0xa98392fe6e24ad7cebbe996fe6a99d7c6a838eda4da441699a315c1ebc8baa6f")
        this.sdk.senderAddress = keypair.getPublicKey().toSuiAddress()
        console.log(this.sdk.senderAddress)
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
        this.uri = '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630'
        const pool = await this.sdk.Pool.getPool(this.uri)  
        let price = TickMath.sqrtPriceX64ToPrice(new BN(pool.current_sqrt_price), tokenB.decimals, tokenA.decimals)
        price = new Decimal(1).dividedBy(price)

        // // Whether the swap direction is token a to token b
        // const a2b = true
        // // fix input token amount
        // const coinAmount = new BN(amount)
        // // input token amount is token a
        // const byAmountIn = true
        // // Fetch pool data
        // const pool = await this.sdk.Pool.getPool('0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688630')
        // console.log(pool)
        // // Estimated amountIn amountOut fee
        // const res: any = await this.sdk.Swap.preswap({
        //   pool: pool,
        //   currentSqrtPrice: pool.current_sqrt_price,
        //   coinTypeA: pool.coinTypeA,
        //   coinTypeB: pool.coinTypeB,
        //   decimalsA: tokenA.decimals, // coin a 's decimals
        //   decimalsB: tokenB.decimals, // coin b 's decimals
        //   a2b,
        //   byAmountIn,
        //   amount: coinAmount.toString(),
        // })

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
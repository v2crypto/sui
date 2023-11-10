import { BigNumber, Wallet, ethers, logger } from "ethers";
import { DexConnector } from "../dex";
import { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS, SIDE, SWAP_ROUTER_ADDRESS } from "../../const";
import { FeeAmount, Pool, Route, SwapOptions, SwapQuoter, SwapRouter, Trade, computePoolAddress } from "@uniswap/v3-sdk";
import { Currency, CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import { BaseProvider } from "@ethersproject/providers";
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { ERC20Token } from "../../token/erc20";
import JSBI from 'jsbi'
import { sendTransactionViaWallet } from "./uniswap-provider";
import { settings } from "../../settings";
import { fromReadableAmount } from "../../utils";

export type TokenTrade = Trade<Token, Token, TradeType>

export enum TransactionState {
  Failed = 'Failed',
  New = 'New',
  Rejected = 'Rejected',
  Sending = 'Sending',
  Sent = 'Sent',
}

export class UniswapConnector implements DexConnector {

    constructor(public wallet: Wallet, public provider: BaseProvider) {}

    async isTransactionSynced() {
        const [latest, pending] = await Promise.all([
          this.wallet.getTransactionCount('latest'),
          this.wallet.getTransactionCount('pending')
        ])
        return latest === pending
      }

    async getTradeAmount(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number) {
      const tokenIn = side === "BUY" ? tokenB : tokenA
      const tokenOut = side === "BUY" ? tokenA : tokenB
      const poolAddress = await this.getPoolAddress(tokenIn, tokenOut)
      const swapRoute = await this.getSwapRoute(poolAddress, tokenIn, tokenOut)
      const tradeAmount = await this.getQuote(swapRoute, tokenIn, tokenOut, side , amount)
      return Number(ethers.utils.formatUnits(tradeAmount[0],tokenB.decimals))
    }

    async marketOrder(tokenA: ERC20Token, tokenB: ERC20Token, side: SIDE, amount: number) {
      const tokenIn = side === "BUY" ? tokenB : tokenA
      const tokenOut = side === "BUY" ? tokenA : tokenB
      if (settings.level === 'debug') {
        logger.info(`UniswapConnector.marketOrder: tokenIn: ${tokenIn.symbol}, tokenOut: ${tokenOut.symbol}, amount: ${amount}, 方向为：` + side === "BUY" ? "BUY" : "SELL")
        return
      }
      const tx = await this.createTrade(tokenIn, tokenOut, side, amount)
      const tradeStatus = await this.executeTrade(tx)
      return tradeStatus
    }

    private async getQuote(route: Route<Currency, Currency>, tokenIn: ERC20Token, tokenOut: ERC20Token, side: SIDE, amount: number) {

      const tradeType = side === "BUY" ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT
      const token = side === "BUY" ? tokenOut : tokenIn
      
      const { calldata } = await SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(
          token.token,
          fromReadableAmount(
            amount,
            token.decimals
          )
        ),
        tradeType,
        {
          useQuoterV2: true,
        }
      )
      
      const quoteCallReturnData = await this.provider.call({
        to: QUOTER_CONTRACT_ADDRESS,
        data: calldata,
      })
      
      // use v6 abi coder to decode the return data
      return ethers.utils.defaultAbiCoder.decode(['uint256'], quoteCallReturnData)
      
    }

    private async getPoolAddress(tokenIn: ERC20Token, tokenOut: ERC20Token) {
      const currentPoolAddress = computePoolAddress({
        factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
        tokenA: tokenIn.token,
        tokenB: tokenOut.token,
        fee: FeeAmount.LOW,
      })
      return currentPoolAddress
    }

    private async getSwapRoute(poolAddress: string, tokenIn: ERC20Token, tokenOut: ERC20Token) {
      const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI.abi,
        this.provider
      )
      const token0 = tokenIn
      const token1 = tokenOut
      const [liquidity, slot0] =
      await Promise.all([
        poolContract.liquidity(),
        poolContract.slot0(),
      ])
      const [sqrtPriceX96, tick] = slot0
      const pool = new Pool(
        token0.token,
        token1.token,
        FeeAmount.LOW,
        sqrtPriceX96.toString(),
        liquidity.toString(),
        // 此处必须转为number，否则会报错
        Number(tick)
      )
      const swapRoute = new Route(
        [pool],
        tokenIn.token,
        tokenOut.token,
      )
      return swapRoute
    }

    private async createTrade(tokenIn: ERC20Token, tokenOut: ERC20Token, side: SIDE ,amountIn: number): Promise<TokenTrade> {
      const tradeType = side === "BUY" ? TradeType.EXACT_OUTPUT : TradeType.EXACT_INPUT
      const poolAddress = await this.getPoolAddress(tokenIn, tokenOut)
      const swapRoute = await this.getSwapRoute(poolAddress, tokenIn, tokenOut)
      const amountOut = await this.getQuote(swapRoute, tokenIn, tokenOut, side, amountIn)

      const uncheckedTrade = Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
          tokenIn.token,
          fromReadableAmount(
            amountIn,
            tokenIn.decimals
          ).toString()
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
          tokenOut.token,
          JSBI.BigInt(amountOut)
        ),
        tradeType,
      })
      return uncheckedTrade
    }

    private async executeTrade(
      trade: TokenTrade
    ): Promise<TransactionState> {
    
      if (!this.wallet.address || !this.provider) {
        throw new Error('Cannot execute a trade without a connected wallet')
      }
    
      const options: SwapOptions = {
        slippageTolerance: new Percent(500, 10000), // 50 bips, or 0.50%
        deadline: Math.floor(Date.now() / 1000) + 60 * 20, // 20 minutes from the current Unix time
        recipient: this.wallet.address,
      }
    
      const methodParameters = SwapRouter.swapCallParameters([trade], options)
    
      const tx: ethers.providers.TransactionRequest = {
        data: methodParameters.calldata,
        to: SWAP_ROUTER_ADDRESS,
        value: methodParameters.value,
        from: this.wallet.address,
        maxFeePerGas: 100000000000,
        maxPriorityFeePerGas: 100000000000,
      }
    
      if (tx.value) {
        tx.value = BigNumber.from(tx.value)
      }
      const res = sendTransactionViaWallet(tx, this.provider, this.wallet)
      return res
    }
    


}
import { BigNumber, Wallet, ethers } from "ethers";
import { DexConnector } from "../dex";
import { POOL_FACTORY_CONTRACT_ADDRESS, QUOTER_CONTRACT_ADDRESS, SIDE, SWAP_ROUTER_ADDRESS } from "../../const";
import { FeeAmount, Pool, Route, SwapOptions, SwapQuoter, SwapRouter, Trade, computePoolAddress } from "@uniswap/v3-sdk";
import { Currency, CurrencyAmount, Percent, Token, TradeType } from "@uniswap/sdk-core";
import { BaseProvider } from "@ethersproject/providers";
import IUniswapV3PoolABI from '@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json'
import { ERC20Token } from "../../token/erc20";
import { fromReadableAmount, toUniswapToken } from "../../utils";
import JSBI from 'jsbi'
import { sendTransactionViaWallet } from "./uniswap-provider";
import { ARB1_ARB_USDT_MAX_FEE_PER_GAS, ARB1_ARB_USDT_MAX_PRIORITY_FEE_PER_GAS } from "../../arbitrage/strategy/arb-usdt";

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

    async getTradeAmount(tokenIn: ERC20Token, tokenOut: ERC20Token, amount: number) {
      const poolAddress = await this.getPoolAddress(tokenIn, tokenOut)
      const swapRoute = await this.getSwapRoute(poolAddress, tokenIn, tokenOut)
      const amountOut = await this.getOutputQuote(swapRoute, tokenIn, tokenOut, amount)
      return Number(JSBI.BigInt(amountOut))
    }

    async  getOutputQuote(route: Route<Currency, Currency>, tokenIn: ERC20Token, tokenOut: ERC20Token, amountIn: number) {

      const { calldata } = await SwapQuoter.quoteCallParameters(
        route,
        CurrencyAmount.fromRawAmount(
          await toUniswapToken(tokenIn),
          fromReadableAmount(
            amountIn,
            tokenIn.decimals
          )
        ),
        TradeType.EXACT_INPUT,
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
        tokenA: await toUniswapToken(tokenIn),
        tokenB: await toUniswapToken(tokenOut),
        fee: FeeAmount.MEDIUM,
      })
      return currentPoolAddress
    }

    async getSwapRoute(poolAddress: string, tokenIn: ERC20Token, tokenOut: ERC20Token) {
      const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI.abi,
        this.provider
      )
      const token0 = await toUniswapToken(tokenIn)
      const token1 = await toUniswapToken(tokenOut)
      const [liquidity, slot0] =
      await Promise.all([
        poolContract.liquidity(),
        poolContract.slot0(),
      ])
      const [sqrtPriceX96, tick] = slot0
      const pool = new Pool(
        token0,
        token1,
        FeeAmount.MEDIUM,
        sqrtPriceX96.toString(),
        liquidity.toString(),
        // 此处必须转为number，否则会报错
        Number(tick)
      )
      const swapRoute = new Route(
        [pool],
        await toUniswapToken(tokenIn),
        await toUniswapToken(tokenOut),
      )
      return swapRoute
    }

    async createTrade(tokenIn: ERC20Token, tokenOut: ERC20Token, amountIn: number): Promise<TokenTrade> {
      const poolAddress = await this.getPoolAddress(tokenIn, tokenOut)
      const swapRoute = await this.getSwapRoute(poolAddress, tokenIn, tokenOut)
      const amountOut = await this.getOutputQuote(swapRoute, tokenIn, tokenOut, amountIn)

      const uncheckedTrade = Trade.createUncheckedTrade({
        route: swapRoute,
        inputAmount: CurrencyAmount.fromRawAmount(
          await toUniswapToken(tokenIn),
          fromReadableAmount(
            amountIn,
            tokenIn.decimals
          ).toString()
        ),
        outputAmount: CurrencyAmount.fromRawAmount(
          await toUniswapToken(tokenOut),
          JSBI.BigInt(amountOut)
        ),
        tradeType: TradeType.EXACT_INPUT,
      })
      return uncheckedTrade
    }

    async executeTrade(
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
        maxFeePerGas: ARB1_ARB_USDT_MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: ARB1_ARB_USDT_MAX_PRIORITY_FEE_PER_GAS,
      }
    
      if (tx.value) {
        tx.value = BigNumber.from(tx.value)
      }
      const res = sendTransactionViaWallet(tx, this.provider, this.wallet)
      return res
    }
    
    async marketOrder(tokenIn: ERC20Token, tokenOut: ERC20Token, amountIn: number) {
      const tx = await this.createTrade(tokenIn, tokenOut, amountIn)
      return this.executeTrade(tx)
    }

}
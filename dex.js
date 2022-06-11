import 'dotenv/config'
import {ethers} from 'ethers'

import {beamABI, erc20ABI, stellaABI} from './abi.js'
import {BEAM, BEAM_SWAP_CONTRACT, COINS, SIDE, STELLA, STELLA_SWAP_CONTRACT} from "./const.js"

// provider
const MOONBEAM_NETWORK_URL = process.env['NETWORK_URL']
const provider = new ethers.providers.JsonRpcProvider(MOONBEAM_NETWORK_URL)

// wallet
let wallet = new ethers.Wallet(process.env['WALLET_PRIVATE_KEY'])
wallet = wallet.connect(provider)

// contracts
// export const beam = new ethers.Contract(BEAM_SWAP_CONTRACT, beamABI, provider)
// export const stella = new ethers.Contract(STELLA_SWAP_CONTRACT, stellaABI, provider)
const name2DC = {
  [BEAM]: new ethers.Contract(BEAM_SWAP_CONTRACT, beamABI, wallet),
  [STELLA]: new ethers.Contract(STELLA_SWAP_CONTRACT, stellaABI, wallet)
}
const paths = {
  BuyGLMR: [COINS.USDC, COINS.GLMR],
  SellGLMR: [COINS.GLMR, COINS.USDC],
}

export class DEX {
  static coinDecimals = {}
  constructor(options={}) {
    this.tradeTimeOut = options.tradeTimeOut | 60 * 20 // seconds
  }

  async isTransactionSynced() {
    const [latest, pending] = await Promise.all([
      wallet.getTransactionCount('latest'),
      wallet.getTransactionCount('pending')
    ])
    return latest === pending
  }

  async decimalsOf (coin) {
    if (DEX.coinDecimals[coin] === undefined) {
      const erc20Contract = new ethers.Contract(COINS[coin], erc20ABI, provider)
      DEX.coinDecimals[coin] = await erc20Contract.decimals()
    }
    return Promise.resolve(DEX.coinDecimals[coin])
  }

  async balanceOf (coin) {
    const erc20Contract = new ethers.Contract(COINS[coin], erc20ABI, provider)
    const decimals = await this.decimalsOf(coin)
    const balance = await erc20Contract.balanceOf(wallet.address)
    return Number(ethers.utils.formatUnits(balance, decimals))
  }

  async trade (dexName, side, amount, slippageAmount) {
    let tx, method, path
    let dex = name2DC[dexName]
    const overrides = {
      gasLimit: 1000000
    }
    const amountParsed = ethers.utils.parseUnits(amount.toString(), 18)
    const slippageAmountParsed = ethers.utils.parseUnits(slippageAmount.toString(), 6)
    const deadline = Math.floor(new Date() / 1000) + this.tradeTimeOut
    // todo 修改成能自动根据 path 和 side 计算出资产的 decimals
    if (side === SIDE.BUY) {
      method = 'swapTokensForExactETH'
      path = paths.BuyGLMR
      tx = await dex[method](amountParsed, slippageAmountParsed, path, wallet.address, deadline, overrides)
    } else if (side === SIDE.SELL) {
      method = 'swapExactETHForTokens'
      overrides['value'] = amountParsed
      path = paths.SellGLMR
      tx = await dex[method](slippageAmountParsed, path, wallet.address, deadline, overrides)
    }
    return tx
  }

  sellOnBeam = async (amount, slippageAmount) => this.trade(BEAM, SIDE.SELL, amount, slippageAmount)
  buyOnBeam = async (amount, slippageAmount) => this.trade(BEAM, SIDE.BUY, amount, slippageAmount)
  sellOnStella = async (amount, slippageAmount) => this.trade(STELLA, SIDE.SELL, amount, slippageAmount)
  buyOnStella = async (amount, slippageAmount) => this.trade(STELLA, SIDE.BUY, amount, slippageAmount)

  async getAmounts (dexName, side, amount) {
    let method
    let dex = name2DC[dexName]
    if (side === SIDE.BUY) {
      method = 'getAmountsIn'
      const amountParsed = ethers.utils.parseUnits(amount.toString(), 18)
      const result = await dex[method](amountParsed, paths.BuyGLMR)
      console.log(Number(ethers.utils.formatUnits(result[0], 6)))
      return Number(ethers.utils.formatUnits(result[0], 6))
    } else if (side === SIDE.SELL) {
      method = 'getAmountsOut'
      const amountParsed = ethers.utils.parseUnits(amount.toString(), 18)
      const result = await dex[method](amountParsed, paths.SellGLMR)
      console.log(typeof Number(ethers.utils.formatUnits(result[1], 6)))
      return Number(ethers.utils.formatUnits(result[1], 6))
    }
  }

  getBeamSellAmounts = async (amount) => this.getAmounts(BEAM, SIDE.SELL, amount)
  getBeamBuyAmounts = async (amount) => this.getAmounts(BEAM, SIDE.BUY, amount)
  getStellaSellAmounts = async (amount) => this.getAmounts(STELLA, SIDE.SELL, amount)
  getStellaBuyAmounts = async (amount) => this.getAmounts(STELLA, SIDE.BUY, amount)
}

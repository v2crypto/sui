import JSBI from 'jsbi'
import { ERC20Token } from './token/erc20';
import { Token } from '@uniswap/sdk-core';
import { ChainId } from '@uniswap/smart-order-router';

export const sleep = async (ms: number) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

export function fromReadableAmount(amount: number, decimals: number): JSBI {
  const extraDigits = Math.pow(10, countDecimals(amount))
  const adjustedAmount = amount * extraDigits
  return JSBI.divide(
    JSBI.multiply(
      JSBI.BigInt(adjustedAmount),
      JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(decimals))
    ),
    JSBI.BigInt(extraDigits)
  )
}

function countDecimals(x: number) {
  if (Math.floor(x) === x) {
    return 0
  }
  return x.toString().split('.')[1].length || 0
}

export const toUniswapToken = async (token: ERC20Token) => {
  const decimals = await token.decimalsOf()
  // TODO: support other chains
  return new Token(
    ChainId.ARBITRUM_ONE,
    token.address,
    decimals,
    token.symbol,
    token.name
  )
}
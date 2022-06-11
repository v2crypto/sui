import 'dotenv/config'
import {ethers} from 'ethers'
import {jest} from '@jest/globals'

import {DEX} from '../dex.js'
import {CEX} from '../cex.js'
import {SIDE, USDC, GLMR} from '../const.js'

jest.setTimeout(20 * 1000)
const dex = new DEX()

it('[dex] get decimals', async function (){
  let d = await dex.decimalsOf(USDC)
  expect(d).toEqual(6)

  d = await dex.decimalsOf(GLMR)
  expect(d).toEqual(18)

  // test from cache
  const s = Date.now()
  await dex.decimalsOf(USDC)
  const e = Date.now()
  expect(e - s).toBeLessThan(10)
})

it('get balance', async function () {
  let b
  b = await dex.balanceOf(USDC)
  expect(b).toBeGreaterThan(0)

  b = await dex.balanceOf(GLMR)
  expect(b).toBeGreaterThan(0)
})

describe('[dex] get price', function () {
  const cex = new CEX({
    apiKey: process.env['ApiKey'],
    apiSecret: process.env['ApiSecret']
  })
  const symbol = 'GLMRUSDT'
  it('sell GLMR price in beam', async function () {
    const price = await cex.client.prices(symbol)
    console.log(price)
    const dexPrice = await dex.getBeamSellAmounts(10)
    expect(dexPrice).toBeCloseTo(price[symbol])
  })

  it('buy GLMR price in beam', async function () {
  })
})

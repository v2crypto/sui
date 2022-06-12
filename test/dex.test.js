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

it('[dex] get balance', async function () {
  let b
  b = await dex.balanceOf(USDC)
  expect(b).toBeGreaterThan(0)

  b = await dex.balanceOf(GLMR)
  expect(b).toBeGreaterThan(0)
})

describe('[dex] get price', function () {
  const symbol = 'GLMRUSDT'
  let price

  beforeAll(async () => {
    const cex = new CEX({
      apiKey: process.env['ApiKey'],
      apiSecret: process.env['ApiSecret']
    })
    const result = await cex.client.prices({symbol})
    price = Number(result[symbol])
  })

  it('sell GLMR price in beam', async function () {
    const dexPrice = await dex.getBeamSellAmounts(1)
    expect(dexPrice).toBeCloseTo(price)
  })

  it('buy GLMR price in beam', async function () {
    const dexPrice = await dex.getBeamBuyAmounts(1)
    expect(dexPrice).toBeCloseTo(price)
  })

  it('sell GLMR price in stella', async function () {
    const dexPrice = await dex.getStellaSellAmounts(1)
    expect(dexPrice).toBeCloseTo(price)
  })

  it('buy GLMR price in stella', async function () {
    const dexPrice = await dex.getStellaBuyAmounts(1)
    expect(dexPrice).toBeCloseTo(price)
  })
})

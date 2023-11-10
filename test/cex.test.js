import 'dotenv/config'
import {jest} from '@jest/globals'

import {CEX} from '../cex.js'
import {fakeOBParams} from './orderbook.js'

const cex = new CEX({
  apiKey: process.env['ApiKey'],
  apiSecret: process.env['ApiSecret']
})

it('[cex]get average price', async function (){
  let total
  for (let params of fakeOBParams) {
    const [ob, side, result] = params
    jest.spyOn(cex.client, 'book').mockImplementationOnce(
      async ({symbol, limit}) => Promise.resolve(ob))
    total = await cex.getAverage('GLMRUSDT', side, 1000, 5)
    expect(total).toEqual(result)
  }
})

it('[cex] get balance', async function (){
  const balance = await cex.getBalance('GLMR')
  expect(balance).toBeGreaterThanOrEqual(0)
})

it('[cex] place order', async function (){
  const o = await cex.order('BTCUSDT', 'BUY', 'MARKET', 0.00005)
  expect(o).toMatchObject({
    symbol: 'BTCUSDT',
    orderId: expect.any(Number),
    type: 'MARKET',
    side: 'BUY',
    result: expect.any(Array),
  })
})
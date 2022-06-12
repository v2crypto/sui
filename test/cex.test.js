import {jest} from '@jest/globals'

import {CEX} from '../cex.js'
import {fakeOBParams} from './orderbook.js'

const cex = new CEX({
  apiKey: process.env['ApiKey'],
  apiSecret: process.env['ApiSecret']
})

it('[cex] average price', async function (){
  let total
  for (let params of fakeOBParams) {
    const [ob, side, result] = params
    jest.spyOn(cex.client, 'book').mockImplementationOnce(
      async ({symbol, limit}) => Promise.resolve(ob))
    total = await cex.getAverage('GLMRUSDT', side, 1000, 5)
    expect(total).toEqual(result)
  }
})
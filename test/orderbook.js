import {SIDE} from '../const.js'

const fakeOB1 = {
  lastUpdateId: 17647759,
  asks:
    [
      { price: '5', quantity: '100' },
      { price: '4', quantity: '400' },
      { price: '3', quantity: '300' },
      { price: '2', quantity: '200' },
      { price: '1', quantity: '100' }
    ],
}

const fakeOB2 = {
  lastUpdateId: 17647759,
  asks:
    [
      { price: '5', quantity: '100' },
      { price: '4', quantity: '100' },
      { price: '3', quantity: '300' },
      { price: '2', quantity: '200' },
      { price: '1', quantity: '100' }
    ],
}

const fakeOB3 = {
  lastUpdateId: 17647759,
  asks:
    [
      { price: '5', quantity: '900' },
      { price: '4', quantity: '100' },
      { price: '3', quantity: '300' },
      { price: '2', quantity: '200' },
      { price: '1', quantity: '100' }
    ],
}

const fakeOB4 = {
  lastUpdateId: 17647759,
  asks:
    [
      { price: '5', quantity: '900' },
      { price: '4', quantity: '100' },
      { price: '3', quantity: '300' },
      { price: '2', quantity: '200' },
      { price: '1', quantity: '1200.11' }
    ],
}

const fakeOB5 = {
  lastUpdateId: 17647759,
  asks:
    [
      { price: '5', quantity: '900' },
      { price: '4', quantity: '100' },
      { price: '3', quantity: '300' },
      { price: '2', quantity: '200.1' },
      { price: '1', quantity: '999' }
    ],
}

const fakeOB6 = {
  lastUpdateId: 17647759,
  bids:
    [
      { price: '1', quantity: '10000' },
      { price: '2', quantity: '10000' },
      { price: '3', quantity: '10000' },
      { price: '4', quantity: '10000' },
      { price: '5', quantity: '10000' },
    ]
}

const fakeOB7 = {
  lastUpdateId: 17647759,
  bids:
    [
      { price: '1', quantity: '100' },
      { price: '2', quantity: '800' },
      { price: '3', quantity: '300' },
      { price: '4', quantity: '10000' },
      { price: '5', quantity: '10000' },
    ]
}

const fakeOB8 = {
  lastUpdateId: 17647759,
  bids:
    [
      { price: '1', quantity: '600' },
      { price: '2', quantity: '100' },
      { price: '3', quantity: '100' },
      { price: '4', quantity: '100' },
      { price: '5', quantity: '100' },
    ]
}

const fakeOB9 = {
  lastUpdateId: 17647759,
  bids:
    [
      { price: '1', quantity: '100' },
      { price: '2', quantity: '100' },
      { price: '3', quantity: '100' },
      { price: '4', quantity: '100' },
      { price: '5', quantity: '100' },
    ]
}

export const fakeOBParams = [
  // order Book, side, expected result
  [fakeOB1, SIDE.BUY, 3000],
  [fakeOB2, SIDE.BUY, 0],
  [fakeOB3, SIDE.BUY, 3300],
  [fakeOB4, SIDE.BUY, 1000],
  [fakeOB5, SIDE.BUY, 1001],

  [fakeOB6, SIDE.SELL, 1000],
  [fakeOB7, SIDE.SELL, 2000],
  [fakeOB8, SIDE.SELL, 2000],
  [fakeOB9, SIDE.SELL, 0],
]
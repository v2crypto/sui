import JSBI from 'jsbi'
import { ERC20Token } from './token/erc20';
import { Token } from '@uniswap/sdk-core';
import { ChainId } from '@uniswap/smart-order-router';
import axios from 'axios';

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

export async function sendToFeishu(text: string) {
  console.log("飞书",text)
  const webhookUrl = 'https://open.feishu.cn/open-apis/bot/v2/hook/32b8b69d-113d-4ef2-aa5e-83584c596815';
  const body = {
    msg_type: 'text',
    content: {
      text: text,
    },
  };

  try {
    const response = await axios.post(webhookUrl, body);
      // console.log('Message sent to Feishu:', response.data);
  } catch (error) {
    console.error('Failed to send message to Feishu:', error);
  }
}

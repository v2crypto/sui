import {  Wallet, ethers } from "ethers"

import { TransactionState } from "./uniswap"
import { BaseProvider } from "@ethersproject/providers"

export async function sendTransactionViaWallet(
    transaction: ethers.providers.TransactionRequest,
    provider: BaseProvider,
    wallet: Wallet,
  ): Promise<TransactionState> {
    const txRes = await wallet.sendTransaction(transaction)
  
    let receipt = null
    if (!provider) {
      return TransactionState.Failed
    }
  
    while (receipt === null) {
      try {
        receipt = await provider.getTransactionReceipt(txRes.hash)
  
        if (receipt === null) {
          continue
        }
      } catch (e) {
        console.log(`Receipt error:`, e)
        break
      }
    }
  
    // Transaction was successful if status === 1
    if (receipt) {
      return TransactionState.Sent
    } else {
      return TransactionState.Failed
    }
  }
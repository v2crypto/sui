// import { Provider, Wallet } from "ethers"

// import { TransactionState } from "./uniswap"

// async function sendTransactionViaWallet(
//     transaction: TransactionRequest,
//     provider: Provider,
//     wallet: Wallet,
//   ): Promise<TransactionState> {
//     // if (transaction.value) {
//     //   transaction.value = BigInt(transaction.value)
//     // }
//     const txRes = await wallet.sendTransaction(transaction)
  
//     let receipt = null
//     if (!provider) {
//       return TransactionState.Failed
//     }
  
//     while (receipt === null) {
//       try {
//         receipt = await provider.getTransactionReceipt(txRes.hash)
  
//         if (receipt === null) {
//           continue
//         }
//       } catch (e) {
//         console.log(`Receipt error:`, e)
//         break
//       }
//     }
  
//     // Transaction was successful if status === 1
//     if (receipt) {
//       return TransactionState.Sent
//     } else {
//       return TransactionState.Failed
//     }
//   }
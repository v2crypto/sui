import * as dotenv from 'dotenv'
import { erc20ABI } from './abi'

dotenv.config()

export const cexSettings = {
    binance: {
        apiKey: process.env.BINANCE_API_KEY!,
        apiSecret: process.env.BINANCE_API_SECRET!,
        httpBase: "https://testnet.binance.vision",
        // httpBase: "https://api.binance.com",
        wsBase: "wss://stream.binance.com:9443/ws",
    },
}

export type ChainSettings = {
    walletPrivateKey: string
    chains: {
        [key: string]: {
            networkUrl: string
            tokens: {
                [key: string]: {
                    ABI: any
                    address: string
                }
            }
        } 
    }
}

export const chainSettings:ChainSettings = {
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY!,
    chains:{
        arb1: {
            networkUrl: "https://arb1.arbitrum.io/rpc",
            tokens: {
                USDT: {
                    ABI: erc20ABI,
                    address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
                },
                ARB: {
                    ABI: erc20ABI,
                    address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
                },
            }
        }
    }
}

export const dexSettings = {
    uniswap: {
    },
}


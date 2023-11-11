
import { erc20ABI } from './abi'

require("dotenv").config()

export const settings = {
    logsPath: process.env.LOGS_PATH || "./logs",
    errorLog: process.env.ERROR_LOG || "error.log",
    infoLog: process.env.INFO_LOG || "info.log",
    level: process.env.LOG_LEVEL || "debug",
}

export const cexSettings = {
    binance: {
        apiKey: process.env.BINANCE_API_KEY!,
        apiSecret: process.env.BINANCE_API_SECRET!,
        //httpBase: "https://testnet.binance.vision",
        httpBase: "https://api3.binance.com",
        wsBase: "wss://stream.binance.com:9443/ws",
        proxy: process.env.PROXY
    },
}

export type ChainSettings = {
    walletPrivateKey: string
    chains: {
        [key: string]: {
            networkUrl: string
        } 
    }
}

export const chainSettings:ChainSettings = {
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY!,
    chains:{
        arb1: {
            networkUrl: "https://arb1.arbitrum.io/rpc",
        }
    }
}

export const dexSettings = {
    uniswap: {
    },
}


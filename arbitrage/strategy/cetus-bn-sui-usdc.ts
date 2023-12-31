import { CDArbitrage } from "..";
import { CexClient } from "../../cex/cex";
import { BinanceConnector } from "../../cex/connectors/binance";
import { DexClient } from "../../dex/dex";
import { UniswapConnector } from "../../dex/connectors/uniswap";
import { ethers } from "ethers";
import { chainSettings } from "../../settings";
import { decimalDivide, sendToFeishu, sleep } from "../../utils";
import logger from "../../log";
import { Arb1UsdcToken } from "../../token/arb1-usdc";
import { Pair } from "../../pair/pair";
import { CetusConnector } from "../../dex/connectors/cetus";
import { SuiSuiToken } from "../../token/sui-sui";
import { SuiUsdtToken } from "../../token/sui-usdt";
import axios from 'axios';
import { SuiUsdcToken } from "../../token/sui-usdc";
import Decimal from "decimal.js";

// // provider
// const NETWORK_URL = chainSettings.chains.arb1.networkUrl
// const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL)

// // wallet
// const WALLET_PRIVATE_KEY = chainSettings.walletPrivateKey!
// let wallet = new ethers.Wallet(WALLET_PRIVATE_KEY)
// wallet = wallet.connect(provider)


const binanceConnector = new BinanceConnector();
const cexClient = new CexClient(binanceConnector);

const cetusConnector = new CetusConnector();
const dexClient = new DexClient(cetusConnector);

const suiSuiToken = new SuiSuiToken(null)
const arb1UsdcToken = new SuiUsdcToken(null)

const dPair = new Pair(suiSuiToken, arb1UsdcToken)
const cPair = new Pair(suiSuiToken, arb1UsdcToken)


const cdArbitrage = new CDArbitrage(cexClient, dexClient, null);

const expectedAmount = 1000;
const expectedSpread = 0.004;

const run = async () => {
    // const isBalanceEnough = await cdArbitrage.isBalanceEnough(arb1UsdtToken, 0);
    
    // if (!isBalanceEnough) {
    //     logger.info("balance is not enough");
    //     await sleep(1000)
    //     return;
    // }

    // const isTradable = await cdArbitrage.isTradable();

    // if (!isTradable) {
    //     logger.info("not tradable");
    //     await sleep(1000)
    //     return;
    // }

    // 获取USDC价格

    const [c2dSpread, c2dAmount, c2dGot] = await cdArbitrage.getC2DSpreadAndAmount(expectedAmount, cPair, dPair);
    logger.info(`c2dSpread: ${c2dSpread}, c2dAmount: ${c2dAmount}, c2dGot: ${c2dGot}`)
    
    if (c2dSpread > expectedSpread && c2dGot && c2dAmount) { 
        logger.info(`${getCurrentBeijingTime()}:币安价格高 Spread为:${c2dSpread},高于预期:${expectedSpread}`)
        // 打印东八区时间
        sendToFeishu(`当前时间: ${getCurrentBeijingTime()}\n
        买卖${expectedAmount}个${suiSuiToken.symbol}\n
        币安价格高: ${decimalDivide(c2dGot, expectedAmount)}\n
        cetus价格低: ${decimalDivide(c2dAmount, expectedAmount)}\n
        Spread为:${c2dSpread * 100}%\n
        高于预期:${expectedSpread * 100}%`)
        // await cdArbitrage.C2DOrder(expectedAmount, c2dAmount, cPair, dPair, uPair)
        return
    }

    const [d2cSpread, d2cAmount, d2cGot] = await cdArbitrage.getD2CSpreadAndAmount(expectedAmount, cPair, dPair);
    logger.info(`d2cSpread: ${d2cSpread}, d2cAmount: ${d2cAmount}, d2cGot: ${d2cGot}`)
    if (d2cSpread > expectedSpread && c2dGot && c2dAmount) {
        logger.info(`${getCurrentBeijingTime()}:cetus价格高 Spread为:${d2cSpread},高于预期:${expectedSpread}`)
        sendToFeishu(`当前时间: ${getCurrentBeijingTime()}\n
        买卖${expectedAmount}个${suiSuiToken.symbol}，
        cetus价格高: ${decimalDivide(d2cAmount, expectedAmount)}\n
        币安价格低: ${decimalDivide(d2cGot, expectedAmount)}\n
        Spread为:${d2cSpread * 100}%\n
        高于预期:${expectedSpread * 100}%`)
        
        return
        // await cdArbitrage.D2COrder(expectedAmount, d2cAmount, cPair, dPair, uPair)
    }
}


(async () => {

    while (true) {
        try {
            await run()
            logger.info("done")
        } catch (e) {
            logger.error("runtime error: ", e)
        }
        await sleep(1 * 100)
    }

})();

function getCurrentBeijingTime() {
  const currentTime = new Date();
  const beijingTime = currentTime.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' });
  return beijingTime;
}

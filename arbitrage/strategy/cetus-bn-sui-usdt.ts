import { CDArbitrage } from "..";
import { CexClient } from "../../cex/cex";
import { BinanceConnector } from "../../cex/connectors/binance";
import { DexClient } from "../../dex/dex";
import { UniswapConnector } from "../../dex/connectors/uniswap";
import { ethers } from "ethers";
import { chainSettings } from "../../settings";
import { sleep } from "../../utils";
import logger from "../../log";
import { Arb1UsdcToken } from "../../token/arb1-usdc";
import { Pair } from "../../pair/pair";
import { CetusConnector } from "../../dex/connectors/cetus";
import { SuiSuiToken } from "../../token/sui-sui";
import { SuiUsdtToken } from "../../token/sui-usdt";
import axios from 'axios';

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
const arb1UsdtToken = new SuiUsdtToken(null)

const dPair = new Pair(suiSuiToken, arb1UsdtToken)
const cPair = new Pair(suiSuiToken, arb1UsdtToken)


const cdArbitrage = new CDArbitrage(cexClient, dexClient, null);

const expectedAmount = 100;
const expectedSpread = 0.003;

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

    const [c2dSpread, c2dAmount] = await cdArbitrage.getC2DSpreadAndAmount(expectedAmount, cPair, dPair);
    logger.debug(`c2dSpread: ${c2dSpread}, c2dAmount: ${c2dAmount}`)
    
    if (c2dSpread > expectedSpread) {
        logger.info("币安价格高" + `Spread为:${c2dSpread},高于预期:${expectedSpread}`)
        sendToFeishu(`币安价格高` +`Spread为:${c2dSpread * 100}%,高于预期:${expectedSpread * 100}%`)
        // await cdArbitrage.C2DOrder(expectedAmount, c2dAmount, cPair, dPair, uPair)
        return
    }

    const [d2cSpread, d2cAmount] = await cdArbitrage.getD2CSpreadAndAmount(expectedAmount, cPair, dPair);
    logger.debug(`d2cSpread: ${d2cSpread}, d2cAmount: ${d2cAmount}`)
    if (d2cSpread > expectedSpread) {
        logger.info("cetus价格高" + `Spread为:${d2cSpread},高于预期:${expectedSpread}`)
        sendToFeishu(`cetus价格高` + `Spread为:${d2cSpread * 100}%,高于预期:${expectedSpread * 100}%`)
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
            await sleep(2 * 1000)
        }
    }

})();

async function sendToFeishu(text: string) {
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

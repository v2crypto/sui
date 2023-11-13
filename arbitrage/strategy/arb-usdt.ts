import { CDArbitrage } from "..";
import { CexClient } from "../../cex/cex";
import { BinanceConnector } from "../../cex/connectors/binance";
import { DexClient } from "../../dex/dex";
import { UniswapConnector } from "../../dex/connectors/uniswap";
import { ethers } from "ethers";
import { chainSettings } from "../../settings";
import { Arb1UsdtToken } from "../../token/arb1-usdt";
import { Arb1ArbToken } from "../../token/arb1-arb";
import { sleep } from "../../utils";
import logger from "../../log";
import { Pair } from "../../pair/pair";


// provider
const NETWORK_URL = chainSettings.chains.arb1.networkUrl
const provider = new ethers.providers.JsonRpcProvider(NETWORK_URL)

// wallet
const WALLET_PRIVATE_KEY = chainSettings.walletPrivateKey!
let wallet = new ethers.Wallet(WALLET_PRIVATE_KEY)
wallet = wallet.connect(provider)

const binanceConnector = new BinanceConnector();
const cexClient = new CexClient(binanceConnector);

const uniswapConnector = new UniswapConnector(wallet, provider);
const dexClient = new DexClient(uniswapConnector);

const arb1ArbToken = new Arb1ArbToken(wallet)
const arb1UsdtToken = new Arb1UsdtToken(wallet)
const dPair = new Pair(arb1ArbToken, arb1UsdtToken)
const cPair = new Pair(arb1ArbToken, arb1UsdtToken)


const cdArbitrage = new CDArbitrage(cexClient, dexClient, wallet);

const expectedAmount = 100;
const expectedSpread = 0.003;

const run = async () => {
    const isBalanceEnough = await cdArbitrage.isBalanceEnough(arb1UsdtToken, 0);
    
    if (!isBalanceEnough) {
        logger.info(`${arb1UsdtToken.symbol} balance is not enough`);
        await sleep(1000)
        return;
    }

    const isTradable = await cdArbitrage.isTradable();

    if (!isTradable) {
        logger.info("not tradable");
        await sleep(1000)
        return;
    }

    const [c2dSpread, c2dAmount] = await cdArbitrage.getC2DSpreadAndAmount(expectedAmount, cPair, dPair);
    logger.info(`c2dSpread: ${c2dSpread}, c2dAmount: ${c2dAmount}`)
    if (c2dSpread > expectedSpread) {
        logger.info("币安价格高" + `Spread为:${c2dSpread},高于预期:${expectedSpread}`)
        await cdArbitrage.C2DOrder(expectedAmount, c2dAmount, cPair, dPair)
        return
    }

    const [d2cSpread, d2cAmount] = await cdArbitrage.getD2CSpreadAndAmount(expectedAmount, cPair, dPair);
    logger.info(`d2cSpread: ${d2cSpread}, d2cAmount: ${d2cAmount}`)
    if (d2cSpread > expectedSpread) {
        logger.info("uniswap价格高" + `Spread为:${d2cSpread},高于预期:${expectedSpread}`)
        await cdArbitrage.D2COrder(expectedAmount, d2cAmount, cPair, dPair)
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


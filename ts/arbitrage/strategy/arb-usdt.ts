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

export const ARB1_ARB_USDT_MAX_FEE_PER_GAS = 100000000000
export const ARB1_ARB_USDT_MAX_PRIORITY_FEE_PER_GAS = 100000000000

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


const cdArbitrage = new CDArbitrage(cexClient, dexClient, arb1ArbToken, arb1UsdtToken, wallet);

const expectedSpread = 0.01;

const run = async () => {
    const isBalanceEnough = await cdArbitrage.isBalanceEnough("USDT", 0);
    
    if (!isBalanceEnough) {
        console.log("balance is not enough");
        await sleep(1000)
        return;
    }

    const isTradable = await cdArbitrage.isTradable();

    if (!isTradable) {
        console.log("not tradable");
        await sleep(1000)
        return;
    }

    const symbol = arb1ArbToken.symbol + arb1UsdtToken.symbol
    const [c2dSpread, c2dAmount] = await cdArbitrage.getC2DSpreadAndAmount(symbol, 0.0001);
    if (c2dSpread > expectedSpread) {
        await dexClient.marketOrder(arb1UsdtToken, arb1ArbToken, c2dAmount);
        await cexClient.marketOrder(symbol, "SELL", c2dAmount);
        return;
    }

    const [d2cSpread, d2cAmount] = await cdArbitrage.getD2CSpreadAndAmount(symbol, 0.0001);
    if (d2cSpread > expectedSpread) {
        await dexClient.marketOrder(arb1ArbToken, arb1UsdtToken, d2cAmount);
        await cexClient.marketOrder(symbol, "BUY", d2cAmount);
    }
}

(async () => {

    // while (true) {
        try {
            await run()
            console.log("done")
        } catch (e) {
            console.log(e)
            // await sleep(2 * 1000)
        }
    // }

})();


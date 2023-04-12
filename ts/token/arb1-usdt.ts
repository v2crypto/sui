import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";

export class Arb1UsdtToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet, "arb1", "USDT", "Arb1 USDT Token")
    }
}
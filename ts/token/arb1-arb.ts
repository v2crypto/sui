import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";

export class Arb1ArbToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet, "arb1", "ARB", "Arb1 ARB Token")
    }
}
import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";
import { erc20ABI } from "../abi";

export class Arb1UsdcToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet, {
            symbol: "USDC",
            name: "USD Coin (Arb1)",
            decimals: 6,
            address: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8",
            ABI: erc20ABI,
            chainId: 42161,
        })
    }
}
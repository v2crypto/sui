import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";
import { erc20ABI } from "../abi";

export class Arb1UsdtToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet, {
            symbol: "USDT",
            name: "Tether USD",
            decimals: 6,
            address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            ABI: erc20ABI,
            chainId: 42161,
        })
    }
}
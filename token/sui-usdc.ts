import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";
import { erc20ABI } from "../abi";

export class SuiUsdcToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet, {
            symbol: "USDC",
            name: "USDC (SUI)",
            decimals: 6,
            address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            suiAddress: "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
            ABI: erc20ABI,
            chainId: 0,
        })
    }
}
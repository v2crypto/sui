import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";
import { erc20ABI } from "../abi";

export class SuiSuiToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet,{
            symbol: "SUI",
            name: "Sui",
            decimals: 9,
            address: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
            suiAddress: "0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI",
            ABI: erc20ABI,
            chainId: 0,
        })
    }
}
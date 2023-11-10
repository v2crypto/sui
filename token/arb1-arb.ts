import { Wallet } from "ethers";
import { ERC20Token } from "./erc20";
import { erc20ABI } from "../abi";

export class Arb1ArbToken extends ERC20Token {
    constructor(
        public wallet: Wallet,
        
    ) {
        super(wallet,{
            symbol: "ARB",
            name: "Arbitrum",
            decimals: 18,
            address: "0x912ce59144191c1204e64559fe8253a0e49e6548",
            ABI: erc20ABI,
            chainId: 42161,
        })
    }
}
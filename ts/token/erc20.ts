import { Contract, Wallet, ethers } from "ethers"
import { Token } from '@uniswap/sdk-core';

export type TokenInfo = {
    symbol: string
    name: string
    decimals: number
    address: string
    ABI: any
    chainId: number
    
}

export class ERC20Token extends Token{
    private constract: Contract
    public ABI: any

    constructor(
        public wallet: Wallet,
        tokenInfo: TokenInfo
    ) {
        super(tokenInfo.chainId, tokenInfo.address, tokenInfo.decimals, tokenInfo.symbol, tokenInfo.name)
        this.ABI = tokenInfo.ABI
        this.constract = new ethers.Contract(this.address, this.ABI, wallet)
    }

    // async decimalsOf() {
    //     if (this.decimals) {
    //         return this.decimals
    //     }
    //     const decimals = await this.constract.decimals()
    //     this.decimals = Number(decimals)
    //     return this.decimals
    // }

    async balanceOf(address: string) {
        const balance= await this.constract.balanceOf(address)
        return Number(balance) / 10 ** this.decimals
    }
}

import { Contract, Wallet, ethers } from "ethers"
import { chainSettings } from "../settings"

export class ERC20Token {
    private constract: Contract
    public decimals: number
    public address: string

    constructor(
        public wallet: Wallet,
        public chain: string,
        public symbol: string,
        public name: string,
    ) {
        const abi = chainSettings.chains[chain].tokens[symbol].ABI
        this.address = chainSettings.chains[chain].tokens[symbol].address
        this.constract = new ethers.Contract(this.address, abi, wallet)
    }

    async decimalsOf() {
        if (this.decimals) {
            return this.decimals
        }
        const decimals = await this.constract.decimals()
        this.decimals = Number(decimals)
        return this.decimals
    }

    async balanceOf(address: string) {
        const balance= await this.constract.balanceOf(address)
        const decimals = await this.decimalsOf()
        return Number(balance) / 10 ** decimals
    }
}

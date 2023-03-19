import time
import threading

from binance.spot import Spot as Client
from binance.lib.utils import config_logging
from web3 import Web3

import beam_abi
import Stell_abi
import GLMR_ERC_ABI
import Glmr_Util
import datetime

mock_item = {"key_1": "value_1", "key_2": "value_2"}
beamswap = "0x96b244391D98B62D19aE89b1A4dCcf0fc56970C7"
stell = "0xd0A01ec574D1fC6652eDF79cb2F880fd47D34Ab1"
usdc = "0x818ec0A7Fe18Ff94269904fCED6AE3DaE6d6dC0b"
busd = "0xA649325Aa7C5093d12D6F98EB4378deAe68CE23F"
glmr = "0xAcc15dC74880C9944775448304B263D191c6077F"
to="0x2849EF9C4F4f8A2BA98279dcb4d61B7a4a982b32"
eth = "0xfA9343C3897324496A05fC75abeD6bAC29f8A40f"
key=""
secret=""
bn1=0
#查询买卖5条挂单的平均价格和数量
#差价比率，0.005为千分之五利润
limt_cj = 0.0045
cj=0.0031
'''
 "https://moonbeam-api.ap-southeast-1.bwarelabs.com/7418518a-bb9a-4e10-9556-e82a1b4ca827",
SETTING = {
    "ROPSTEN_URL": "XXX",
    "MAINNET_URL": "https://rpc.api.moonbeam.network",
    "CONTRACT_ADDRESS":"0x96b244391D98B62D19aE89b1A4dCcf0fc56970C7",
    "WALLET_PRIVATEKEY": "",
    "WALLET_ADDRESS": ""
}
'''

SETTING = {
    "ROPSTEN_URL": "XXX",
    "MAINNET_URL": "https://rpc.api.moonbeam.network",
    "CONTRACT_ADDRESS":"0x96b244391D98B62D19aE89b1A4dCcf0fc56970C7",
    "WALLET_PRIVATEKEY": "",
    "WALLET_ADDRESS": ""
}
myadr=""
w3 = Web3(Web3.HTTPProvider(SETTING["MAINNET_URL"]))

#beam买入GLMRpath
path_beam_buy_GLMR=[]
path_beam_buy_GLMR.append(usdc)
path_beam_buy_GLMR.append(glmr)
#beam卖出GLMRpath
path_beam_sell_GLMR=[]
path_beam_sell_GLMR.append(glmr)
path_beam_sell_GLMR.append(usdc)

contractaddr =beamswap

#执行卖beam 或者stell 标志 0：beam 1:stell
SELL_DEX_BZ=0
#执行买beam 或者stell 标志 0：beam 1:stell
BUY_DEX_BZ=0
#卖单限价单号
limt_orderid_sell=0
#买单限价单号
limt_orderid_buy=0


class MyThred(threading.Thread):
    def __init__(self,thead_id,name,result,bz,num):
        threading.Thread.__init__(self)
        self.threadID = thead_id
        self.name = name
        self.result = result
        self.bz =bz
        self.num = num
    def run(self):
        trade_program(self.name,self.result,self.bz,self.num)


def trade_program(threadn_ame,result,bz,num):
    while True:
        time.sleep(1)
        bl=int(w3.eth.blockNumber)
        print("start",datetime.datetime.now())
        rs = w3.eth.wait_for_transaction_receipt(result,60)
        print("end", datetime.datetime.now())
        status = int(rs["status"])
        print("STATUS","-------",status)
        if(status==1):
            print("链上交易成功")
            break
        else:
            if(bz==1):
                 #复位交易所买入操作（市价卖出）
                # 币安交易所卖出
                client_trade = Client(key, secret)
                params = {
                        "symbol": "GLMRUSDT",
                        "side": "SELL",
                        "type": "MARKET",
                        "quantity": num,
                        "recvWindow": 1000,
                    }
                ts = client_trade.new_order(**params)
                print("链上交易失败，交易所卖出")
                break
            if(bz == 0):
                #复位交易所卖出操作 （市价买入）
                params = {"symbol": "GLMRUSDT",
                              "side": "BUY",
                              "type": "MARKET",
                              "quantity": num,
                              "recvWindow": 1000}
                # 币安交易所买入
                client_trade = Client(key, secret)
                ts = client_trade.new_order(**params)
                print("链上交易失败，交易所买入")
                break


if __name__ == '__main__':
    while True:
        time.sleep(1)
        bn = w3.eth.blockNumber
        mrbz = 1
        mcbz = 1
        #当前正在执行交易次数
        pinding = int(w3.eth.get_transaction_count(myadr,"pending"))
        pd2 = int(w3.eth.get_transaction_count(myadr))
        # 钱包所剩GLMR余额
        if(pinding==pd2):
            glmr_bance = Glmr_Util.balanceOf(to)
            glmr_bance = int(repr(glmr_bance)[:-18])
            if(glmr_bance<1000):
                mcbz = 0
        else:
            #print("区块未更新")
            continue
       # if (int(glmr_bance) < 1000):
        #    print("--------------------WGMLR余额为", glmr_bance, "--------------请及时提币")
        # 查询币安交易所GLMR余额
        bianance_glmr = int(Glmr_Util.getbinancebalances("GLMR"))
        if(bianance_glmr<1000):
            print("--------------------币安交易所余额已经不足", bianance_glmr, "--------------请及时充币")
        #执行差价等于在执行次数乘以差价
        pd_cs = pinding-pd2+1
        cj = pd_cs*cj
        spot_client = Client(base_url="https://api.binance.com")
        rs = spot_client.depth("GLMRUSDT", limit=5)
        '''------------------交易所卖出价格，DEX买入价格---------------------------------------------------------------'''
        #获取买单列表平均价(交易所卖单为DEX买单)
        lst_sell = Glmr_Util.getbuyprice(rs,"bids")
        sell_nums = lst_sell[0]
        sell_prices = lst_sell[1]
        #if (sell_nums > glmr_bance):
        #    sell_nums = glmr_bance
        #print("5格可卖出数量为：",sell_nums,"卖出均价为:",sell_prices)
        #获取卖单列表平均价(交易所买单为DEX卖单)
        # 获取DEX买入价格
        amountIn= sell_nums*10**18
        ts = Glmr_Util.getAmountsin(amountIn, path_beam_buy_GLMR,contractaddr,beam_abi.abi)
        ts_stell = Glmr_Util.getAmountsin(amountIn, path_beam_buy_GLMR,stell,Stell_abi.abi)
        buy_beam = int(ts[0])
        buy_stell = int(ts_stell[0])
        if(buy_beam<=buy_stell):
            Dex_by_price = repr(ts[0])
            contractaddr = beamswap
            abi = beam_abi.abi
        else:
            Dex_by_price = repr(ts_stell[0])
            contractaddr = stell
            abi = Stell_abi.abi
        '''----------------------------------------------------------------------------------------------------------------'''
        lst_buy = Glmr_Util.getbuyprice(rs, "asks")
        buy_nums = lst_buy[0]
        buy_prices = lst_buy[1] #返回为单价
        #print("5格可买入数量为：",buy_nums,"买入均价为:",buy_prices)
        sell_nums =int(sell_nums)
        amountIn = sell_nums*10**18
        '''-------------------------------------------------------------------------------------------------------------'''
        # 通过一个随机数查询BEAM卖出单价(限价单)
        '''--------------------------------------------------------------------------------------------------------------'''
        #binance_new_limt_order()
        #从倒数第六位开始截取USDC到6位小数
        Dex_by_price = int(Dex_by_price[:-6])
        binance_pr = int(sell_nums * sell_prices)
        #print("DEX买入总价----", Dex_by_price)
        #print("币安可卖出总价---", binance_pr)
        # DEX买入差价比
        cjb = (binance_pr - Dex_by_price) / Dex_by_price
        #print("DEX买入差价比",cjb)
        # 获取beam卖出价格
        amountout=buy_nums*10**18
        ts = Glmr_Util.getAmountsOut(amountout, path_beam_sell_GLMR,beamswap,beam_abi.abi)
        ts_stell1 = Glmr_Util.getAmountsOut(amountout, path_beam_sell_GLMR, stell, Stell_abi.abi)
        sel_beam = int(ts[1])
        sell_stell = int(ts_stell1[1])
        if(sel_beam>=sell_stell):
            beam_sell_price = repr(ts[1])
            contractaddr_sell = beamswap
            abi_sell = beam_abi.abi
        else:
            beam_sell_price =repr(ts_stell1[1])
            contractaddr_sell = stell
            abi_sell = Stell_abi.abi

        # 从倒数第六位开始截取USDC到6位小数
        beam_sell_price = int(beam_sell_price[:-6])
        #print("beam DEX卖出总价----", beam_sell_price)
        # DEX卖出差价比
        binance_pr_buy = int(buy_nums * buy_prices)
        cjb_sell = (beam_sell_price - binance_pr_buy) / beam_sell_price
        #print("DEX卖出差价比",cjb_sell)
        # 币安交易所剩余GLMR余额
        balance_glmr = Glmr_Util.getbinancebalances("GLMR")
        # 如果币安可用余额不足，按照币安剩余数量操作
        if (int(balance_glmr) < 1000):
            mrbz =0
        if(cjb >= cj and mrbz == 1):
            print("出现差价,DEX买入对冲数量---",sell_nums,"币安卖出总价----",binance_pr,"DEX买入总价---",Dex_by_price)

            if(int(balance_glmr) < sell_nums):
                print("交易所可用余额不足，请及时充值")
                break
                #dex_buy_price = (dex_buy_price / sell_nums)*balance_glmr
                sell_nums=balance_glmr

            params = {
                "symbol": "GLMRUSDT",
                "side": "SELL",
                "type": "MARKET",
                "quantity":sell_nums,
                "recvWindow": 1000,
            }

            #print(ts)
            #开始执行DEX合约买入
            bn1 = w3.eth.blockNumber
            #卖出数量
            amountOut = sell_nums*10**18
            #最多支付USDC数量(滑点)(最大滑点按照币安卖出总价扣千一手续费)
            amoutInMax=int(binance_pr*0.999)*10**6
            #获取最后结束时间
            deadline=Glmr_Util.getDeadline()
            nonce = w3.eth.get_transaction_count(myadr,"pending")
            try:
                tx_id = Glmr_Util.swapTokensForExactTokens(amountOut, amoutInMax, path_beam_buy_GLMR, to,deadline,nonce,contractaddr,abi)
                sing_txn = w3.eth.account.signTransaction(tx_id, private_key=SETTING["WALLET_PRIVATEKEY"])
                result = w3.eth.sendRawTransaction(sing_txn.rawTransaction)
                # 币安交易所卖出
                client_trade = Client(key, secret)
                ts = client_trade.new_order(**params)
                trade1 = MyThred(1, "Thread-1", result,  bz=0, num=sell_nums)
                trade1.start()
            except Exception as e:
                print("程序发生错误，重启")
                time.sleep(3)
                continue
            time.sleep(6)
        else:
            if(cjb_sell>=cj and mcbz==1):
                if(glmr_bance<buy_nums):
                    buy_nums = glmr_bance
                print("出现差价,DEX买入对冲数量---", buy_nums, "币安买入总价----", binance_pr_buy, "DEX卖出总价---", beam_sell_price)
                #buy_nums
                params = {"symbol": "GLMRUSDT",
                    "side": "BUY",
                    "type": "MARKET",
                    "quantity": buy_nums,
                    "recvWindow": 1000}
                #print(ts)
                #开始执行DEX合约卖出
                #bn1 = w3.eth.blockNumber
                #卖出数量
                #uy_nums=20#---------------------------------------------------------------
                #print("buy_prices,",buy_prices*buy_nums)
                p1=buy_nums * buy_prices
                p2 = int(p1)
                amountOut = buy_nums*10**18
                #最少收到USDC数量(滑点)
                je = int(p2*0.997)
                amountInMin=je*10**6
                #print("amountInMin",amountInMin)
                #获取最后结束时间
                deadline=Glmr_Util.getDeadline()
                nonce = w3.eth.get_transaction_count(myadr, "pending")
                try:
                    tx_id = Glmr_Util.swapExactTokensForTokens(amountOut,amountInMin, path_beam_sell_GLMR, to, deadline,nonce,contractaddr_sell,abi_sell)
                    sing_txn = w3.eth.account.sign_transaction(tx_id, private_key=SETTING["WALLET_PRIVATEKEY"])
                    result = w3.eth.send_raw_transaction(sing_txn.rawTransaction)
                    # 币安交易所买入
                    client_trade = Client(key, secret)
                    ts = client_trade.new_order(**params)
                    trade1 = MyThred(2, "Thread-2", result, bz=1, num=buy_nums)
                    trade1.start()
                except Exception as e:
                    print("程序错误",e)
                    time.sleep(3)
                    continue
                #print(result)
                time.sleep(6)
                #bn1 =w3.eth.blockNumber
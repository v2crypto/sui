import time
import datetime
from web3 import Web3

from binance.spot import Spot as Client
import binance.spot.account

import GLMR_ERC_ABI


SETTING = {
    "ROPSTEN_URL": "XXX",
    "MAINNET_URL": "https://rpc.api.moonbeam.network",
    "WALLET_PRIVATEKEY": "",
    "WALLET_ADDRESS": ""
}
key=""
secret=""

myadr=""
w3 = Web3(Web3.HTTPProvider(SETTING["MAINNET_URL"]))
contractbalance =w3.eth.contract(address="0xAcc15dC74880C9944775448304B263D191c6077F",abi=GLMR_ERC_ABI.abi)
#获取WGLMR余额
def  balanceOf(Address):
    tx_dix = contractbalance.functions.balanceOf(Address).call()
    return tx_dix
def withdraw(wad):
    gasprice = w3.toWei('150', 'gwei')
    nonce = w3.eth.get_transaction_count(myadr,"pending")
    print(nonce)
    tx_dix = contractbalance.functions.withdraw(wad).buildTransaction({'from':myadr,'gasPrice': gasprice,'nonce':nonce})
    return tx_dix

#获取GLMR买入价格
def  getAmountsin(amountIn, path,contractaddr,abi):
    contractObj = w3.eth.contract(address=contractaddr, abi=abi)
    tx_dix = contractObj.functions.getAmountsIn(amountIn,path).call()
    return tx_dix
#获取GLMR卖出价格
def  getAmountsOut(amountIn, path,contractaddr,abi):
    contractObj = w3.eth.contract(address=contractaddr, abi=abi)
    tx_dix = contractObj.functions.getAmountsOut(amountIn,path).call()
    return tx_dix
# 买入GLMR#amountInMax最大付出USDC或者BUSD（BUSD保留18位小数）
def swapTokensForExactTokens(amountOut, amountInMax, path,  to, deadline,nonce,contractaddr,abi):
    print(nonce)
    gasprice = w3.toWei('401', 'gwei')
    contractObj = w3.eth.contract(address=contractaddr, abi=abi)
    gas= 125065
    #print(amountOut, amountInMax, path,  to, deadline,nonce)
    tx_dix = contractObj.functions.swapTokensForExactTokens(amountOut, amountInMax, path, to,deadline).buildTransaction({'from':myadr,'gasPrice': gasprice,"gas":gas,'nonce':nonce})
    return tx_dix
# 卖出GLMR
def swapExactTokensForTokens(amountIn,amountOutMin, path, to, deadline,nonce,contractaddr,abi):
    print("nonce值",nonce)
    gasprice = w3.toWei('401', 'gwei')
    gas = 125065
    print(amountIn, amountOutMin, path, to, deadline, nonce)
    contractObj = w3.eth.contract(address=contractaddr, abi=abi)
    tx_dix = contractObj.functions.swapExactTokensForTokens(amountIn,amountOutMin, path, to,deadline).buildTransaction({'from':myadr,'gasPrice': gasprice,"gas":125065,'nonce':nonce})
    print(tx_dix)
    return tx_dix
# 买入GLMR#amountInMax最大付出USDC或者BUSD（BUSD保留18位小数）
def stell_swapTokensForExactTokens(amountOut, amountInMax, path,  to, deadline,nonce,contractaddr,abi):
    print(nonce)
    myad="0xcebb527e3bFDfa1283707DE53751821197b9C2AB"
    gasprice = w3.toWei('180', 'gwei')
    contractObj = w3.eth.contract(address=contractaddr, abi=abi)
    tx_dix = contractObj.functions.swapTokensForExactTokens(amountOut, amountInMax, path, to,deadline).buildTransaction({'from':myad,'gasPrice': gasprice,'nonce':nonce})
    return tx_dix
# 卖出GLMR
def stell_swapExactTokensForTokens(amountIn,amountOutMin, path, to, deadline,nonce,contractaddr,abi):
    print("nonce值",nonce)
    myad = "0xcebb527e3bFDfa1283707DE53751821197b9C2AB"
    gasprice = w3.toWei('180', 'gwei')
    #print(amountIn,amountOutMin, path, to, deadline,nonce)
    contractObj = w3.eth.contract(address=contractaddr, abi=abi)
    tx_dix = contractObj.functions.swapExactTokensForTokens(amountIn,amountOutMin, path, to,deadline).buildTransaction({'from':myad,'gasPrice': gasprice,'nonce':nonce})
    return tx_dix
#获取币安交易所余额
def getbinancebalances(name):
    client_trade = Client(key, secret)
    ss1 = client_trade.account(recvWindow=10000)
    # ss = json.load(ss1)
    T2=ss1["balances"]
    for i in range(len(T2)):
        if(T2[i]["asset"]==name):
            tss = T2[i]["free"]
            st2="."
            st3 = tss[:tss.index(st2)]
            #print(name, "交易所剩余可用---", st3)
            return st3
def getDeadline():
    now = datetime.datetime.now()
    print(now)
    t = (now + datetime.timedelta(minutes=+20)).strftime('%Y-%m-%d %H:%M:%S')
    ts = time.strptime(t, "%Y-%m-%d %H:%M:%S")
    ts1 = int(time.mktime(ts))
    return ts1
#获取币安买入卖出均价
def getAvgPrice(bids):
    #数量
    numbers = 0
    #总金额
    sum_price = 0
    for i in range(len(bids)):
        #价格
        price=float(bids[i][0])
        #数量
        number=float(bids[i][1])
        #金额 数量乘单价
        je = float(round(price,4))*float(round(number,4))
        numbers=float(numbers+number)
        sum_price =sum_price+je
        #总数量超过2000就不再统计
        if(numbers>=1000):
            break
    lt = []
    lt.append(float(round(numbers,4)))
    lt.append(float(round(sum_price,4)))
    return lt
#返回币安交易所5行内可买卖数量和平均价格
def getbuyprice(rs,name):
    #获取买单列表平均价
    bids = rs[name]
    lt_buy = getAvgPrice(bids)
    sell_nums = int(lt_buy[0])
    # 如果5行以内可卖出数量超过1000，卖出数量上限为1000
    if (sell_nums > 1000):
        sell_nums = 1000
    sell_prices = lt_buy[1] / lt_buy[0]
    lt = []
    lt.append(sell_nums)
    lt.append(sell_prices)
    return lt
def binance_new_limt_order(price,quantity,type):
    params = {
        "symbol": "GLMRUSDT",
        "side": type,
        "type": "LIMIT",
        "quantity": quantity,
        "price": price,
        "timeInForce": "GTC",
        "recvWindow": 1000,
    }
    client = Client(key, secret)
    ts = client.new_order(**params)
    orderid = ts["orderId"]
    return(orderid)
def get_banance_Order(orderId):
    params = {
        "symbol": "GLMRUSDT",
        "orderId": orderId,
        }
    client = Client(key, secret)
    ts = client.get_order(**params)
    origQty = ts["origQty"] #用户设置的原始订单数量
    executedQty = ts["executedQty"] # 交易的订单数
    cummulativeQuoteQty=ts["cummulativeQuoteQty"] #累计交易的金额
    price = ts["price"]
    rs =[origQty,executedQty,cummulativeQuoteQty,price]
    return rs
def cancel_Order(orderId):
    params = {
        "symbol": "GLMRUSDT",
        "orderId": orderId,
    }
    client = Client(key, secret)
    ts = client.cancel_order(**params)


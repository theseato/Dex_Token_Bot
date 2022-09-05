require('dotenv').config()

const fs = require('fs')
const dayjs = require('dayjs')


//日志记录到龙日志文件，便于查看
const log4js = require("log4js");
log4js.configure({
  appenders: { dexTokenBot: { type: "file", filename: "dexTokenBot.log" } },
  categories: { default: { appenders: ["dexTokenBot"], level: "debug" } },
});
const logger = log4js.getLogger("dexTokenBot");


//读取Web3和配置文件
const Web3 = require('web3')
const { NetId, WssNet, MaxHex, PancakeRouterV2, PancakeFactoryV2, COIN, ACCOUNT, CONFIG } = require('./config')
const ws = new Web3.providers.WebsocketProvider(WssNet)
const web3 = new Web3(ws)

//载入ABI合约
const PancakeContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./src/abi/pancakeRouterV2.json')), PancakeRouterV2)
const PancakeFactoryContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./src/abi/pancakeFactoryV2.json')), PancakeFactoryV2)
const coinContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./src/abi/coin.json')), CONFIG.coin)


let nonce = 0
let blockNum = 0


//主程序启动
start()
//balanceOf(CONFIG)  // 查余额
//buyToken(CONFIG);  //购买
//preBuyToken(CONFIG,'0x5Aa1a18432Aa60Bad7f3057d71d3774F56CD34b8') //授权地址
//listenMintEvent(CONFIG); //监控购买









/**
 * 启动器
 */
async function start() {
  logger.debug(`${dayjs().format('YYYY-MM-DD HH:mm:ss')}  准备好了抢购钱包:${ACCOUNT.addr} ！`)
  blockNum = await web3.eth.getBlockNumber()
  nonce = await web3.eth.getTransactionCount(ACCOUNT.addr)
  listenPairCreateEvent(CONFIG)                     //  监听交易对，一旦添加池子。完成授权和抢跑准备。
  listenMintEvent(CONFIG)                           //  发现BNB/ Token 的交易对，立即购买
  setInterval(() => { ws.send({ id: 1 }) }, 30000)  //  执行完之后，循环监听 30秒。减少API调用次数  
}



/**
 * 监听创建交易对创建事件
 * @param {*} config 
 */
async function listenPairCreateEvent(config) {
  logger.debug(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 【${config.symbol}】开始监听:流动对 PairCreated 事件`)
  PancakeFactoryContract.events.PairCreated({ fromBlock: blockNum }, (err, event) => {
    if (err) return logger.debug(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 【${config.symbol}】流动对 PairCreated 事件错误: ${err}`)
    const { token0, token1 } = event.returnValues
    if (parseInt(token0) === parseInt(config.coin)) {
      logger.debug(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 【${config.symbol}】流动对 PairCreated 事件触发`)
      preBuyToken(config, token1)
    } else if (parseInt(token1) === parseInt(config.coin)) {
      logger.debug(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 【${config.symbol}】流动对 PairCreated 事件触发`)
      preBuyToken(config, token0)
    }
  })
}

/**
 * 监听流动性交易对事件，如果有交易则出发购买
 * @param {*} config 
 */
async function listenMintEvent(config) {
  const coinList = [COIN.BNB, COIN.BUSD, COIN.BUSDT]
  for (let i = 0; i < coinList.length; i++) {
    const pairAddress = await PancakeFactoryContract.methods.getPair(coinList[i], config.coin).call()
    if (parseInt(pairAddress)) {
      logger.debug(`#1【${config.symbol}】开始监听: 流动对 添加 事件 ${coinList[i]} & ${config.coin}`)
      const PancakeLiquidPairContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./src/abi/pancakeLiquidPair.json')), pairAddress)
      PancakeLiquidPairContract.events.Mint({ fromBlock: blockNum }, (err, event) => {
        logger.debug("#1.1 进入抢购准备！！");
        if (err) return logger.debug(`【${config.symbol}】流动对 Supply 事件错误：${err}`)
        logger.debug(`#1.2【${config.symbol}】流动对事件 Supply 触发: ${pairAddress} ${event}`)
        preBuyToken(config, coinList[i])
      })
    }
  }
}


// 
/**
 * 在Dex授权交易该Token
 * @param {*} config 
 */
 async function approvePancake(config) {
  const data = coinContract.methods.approve(PancakeRouterV2, MaxHex).encodeABI()
  const signedTx = await web3.eth.accounts.signTransaction({
    nonce: nonce++,
    chainId: NetId,
    to: config.coin,
    data,
    gasPrice: config.gasPrice,
    gas: config.gas
  }, ACCOUNT.key)
  logger.debug(`#2.1 【${config.symbol}】开始获取 Token 授权`)
  const res = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  logger.debug(`#2.2 【${config.symbol}】授权结果：${res.status} ${res.transactionHash}`)
}


/**
 * 检查是否可以买入
 * @param {*} config 
 * @param {*} coin 
 * @returns 
 */
function preBuyToken(config, coin) {
  if (config.isBought) return
  if (parseInt(coin) !== parseInt(COIN.BNB)) {
    config.buyPath[1] = coin
    config.buyPath.push(config.coin)
    config.salePath = Array.from(config.buyPath).reverse()
  }
  config.isBought = true
  buyToken(config)
  preSaleToken(config)
}




/**
 * 买入Token
 * @param {*} config 
 */
async function buyToken(config) {
  logger.debug(`#3【${config.symbol}】触发购买任务`)
  
  const data = PancakeContract.methods.swapExactETHForTokens(
    config.minTokenCount,
    config.buyPath,
    ACCOUNT.addr,
    Math.trunc((Date.now() + 60000 * 10) / 10 ** 3)
  ).encodeABI()

  const signedTx = await web3.eth.accounts.signTransaction({
    nonce: nonce++,
    chainId: NetId,
    to: PancakeRouterV2,
    data,
    value: config.buyETHCount * (10 ** 18),
    gasPrice: config.buyGasPrice ,
    gas: config.gas
  }, ACCOUNT.key)

  logger.debug(`#3.1 【${config.symbol}】开始广播购买交易`)
  const res = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  logger.debug(`#3.2 【${config.symbol}】购买结果: ${res.status} ${res.transactionHash}`)
  await balanceOf(config)
}


/**
 * 确认和查询当前余额
 * @param {*} config 
 * @returns 
 */
 async function balanceOf(config) {
  logger.debug(`#4.1 【${config.symbol}】开始查询数量`)
  const res = await coinContract.methods.balanceOf(ACCOUNT.addr).call()
  logger.debug(`#4.2 【${config.symbol}】当前数量：${res}`)
  return res
}


/**
 * 卖出配置
 * @param {*} config 
 */
async function preSaleToken(config) {
  setTimeout(() => {
    logger.debug(`#5 【${config.symbol}】等待5下一次触发卖出`)
    saleToken(config)
  }, 30000 * config.saleInterval)
  await approvePancake(config)
}


/**
 * 卖出该币
 * @param {*} config 
 */
async function saleToken(config) {
  const total = await balanceOf(config)
  const saleAmount = total/100;
  logger.debug("#5 调用卖出 saleToken 方法 ...卖出总量: "+total);
  const data = PancakeContract.methods.swapExactTokensForETHSupportingFeeOnTransferTokens(
    saleAmount,
    0,
    config.salePath,
    ACCOUNT.addr,
    Math.trunc((Date.now() + 60000 * 10) / 10 ** 3)
  ).encodeABI()

  const signedTx = await web3.eth.accounts.signTransaction({
    nonce: nonce++,
    chainId: NetId,
    to: PancakeRouterV2,
    data,
    gasPrice: config.saleGasPrice ,
    gas: config.gas
  }, ACCOUNT.key)
  logger.debug(`#5.1 【${config.symbol}】开始广播出售交易`)
  const res = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
  logger.debug(`#5.2 【${config.symbol}】出售结果：${res.status} ${res.transactionHash}`)
}
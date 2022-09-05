// 关键信息配置在.env 变量中，谨防泄漏
//
// 1、配置抢Toekn交易的钱包，地址和私钥，以及抢的设置
const ACCOUNT = {
    addr:  process.env.ACCOUNT_ADDR ,       // 填抢购的钱包地址 
    key:   process.env.ACCOUNT_PRIVATE_KEY  // 私钥
  }
  
  const gasPrice = 5000000000         //  单位： WEI 
  const buyCount = 0.1                //  单位 ：BNB
  const buyGasPrice = 1.5 * gasPrice  //  单位： WEI （根据gasprice 和竞争程度加大小参考  https://bscscan.com/gastracker
  const saleGasPrice = 1 *  gasPrice  //  单位： WEI
  const gas = 1000000                 //  单位： WEI  Fee  1BNB|ETH = 1*10^9 GWEI  1GWEI= 1*10^9 WEI 
  
  // 2、目标Toekn的合约地址
  // BSC main NET 
  // const symbol = 'LOWB'
  // const token = '0x5Aa1a18432Aa60Bad7f3057d71d3774F56CD34b8'
  //  BSC Test NET  Token  Contract Config 
  const symbol = process.env.SYMBOL
  const token =  process.env.TOKEN
   
  
  // 
  // 3、节点与校验配置  （ETH，等EVM均相同）
  // BSC Main Net  
  // const NetId = 56
  // const WssNet = 'wss://bsc-ws-node.nariox.org:443'
  // const MaxHex = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff   //最大授权数量，64个f 1个f=1111, unit256 就是256个1  10进制 就是 2^256-1
  // BSC Test Net 
  const NetId = process.env.NET_ID
  const WssNet = process.env.NET_WSS_PROVIDER
  const MaxHex = 0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff
  
  
  // 4、Dex交易所配置
  // ETH 主网交易所UniSwap
  // WETH = 0x3bBb875C856b5607DF7740fBd3a40B2B443D6597
  // UniswapV2Factory = 0xf94B5efD90972e5a5e77b5E3dE5236333CedCe6F
  // UniswapV2Router01 =0x41Db8E670e03d864A449ef1106537E6ca0C18dEC
  // UniswapV2Router02 =0x81A14364BF285aeA0BAFf5925670a4bDBD575E99
  // INIT_CODE_HASH = 0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f
  //
  // BSC Main Net Dex交易所 Pancake
  // const PancakeRouterV2 = '0x10ed43c718714eb63d5aa57b78b54704e256024e'
  // const PancakeFactoryV2 = '0xca143ce32fe78f1f7019d7d551a6402fc5350c73'
  
  // BSC TestNet Dex交易所  pancake
  //
  const PancakeRouterV2 = '0xD99D1c33F9fC3444f8101754aBC46c52416550D1'
  const PancakeFactoryV2 = '0x6725F303b657a9451d8BA641348b6761A6CC7a17'
  const X2P = '0x53dcD4eF8E21FE014594a0854c4271a0623B31eC'
  const LOWB = '0x5Aa1a18432Aa60Bad7f3057d71d3774F56CD34b8'
  
  
  // 
  // 5. 用到的COIN 合约地址
  // BSC Main Net
  // const COIN = {
  //   BNB: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
  //   BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
  //   BUSDT: '0x55d398326f99059fF775485246999027B3197955',
  //   CAKE: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'
  // }
  // 
  // BSC Test Net
  const COIN = {
    BNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
    BUSDT: '0x55d398326f99059fF775485246999027B3197955',
    CAKE: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82'
  }
  
  
  
  // 6、封装到对象
  const CONFIG = {
    coin: token,
    symbol,
    buyPath: [COIN.BNB, token],
    salePath: [token, COIN.BNB],
    saleInterval: Number.MAX_SAFE_INTEGER,
    gas: 1000000,
    minTokenCount: BigInt(0 * (10 ** 18)),
    gasPrice: gasPrice,
    buyETHCount: buyCount,
    buyGasPrice: buyGasPrice,
    saleGasPrice: saleGasPrice
  }
  
  
  // 7、封装到模块
  module.exports = {
    NetId,
    WssNet,
    MaxHex,
    PancakeRouterV2,
    PancakeFactoryV2,
    LOWB,
    X2P,
    COIN,
    ACCOUNT,
    CONFIG
  }
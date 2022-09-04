# Dex_Token_Bot

简介
一个基于 web3.js 的 DEX 抢币工具
采用FullNode API服务商提供的Api，https://app.ankr.com （如ETH 推荐Alchemy 等）

实现方法
监听Dex流程池交易对的PairCreated 链事件 - 即交易的流动对
实现自动 Dex 授权
实现自动购买 Token
实现自动间隔出售 Token
查询 Token 总量

目录结构说明
├── contract                        //智能合约源码，可直接在[remix](https://remix.ethereum.org/)上部署
│   ├── WCINU.sol
├── abi                             //智能合约ABI 文件
│   ├── coin.json
│   ├── pancakeFactoryV2.json      
│   ├── pancakeLiquidPair.json
│   └── pancakeRouterV2.json
├── config.js                      //配置
└── index.js                       //主程序

require('dotenv').config()
const WebSocket = require('ws');

//日志记录到龙日志文件，便于查看
const log4js = require("log4js");
log4js.configure({
  appenders: { flash: { type: "file", filename: "flash.log" } },
  categories: { default: { appenders: ["flash"], level: "debug" } },
});

const logger = log4js.getLogger("dexTokenBot");

const fs = require('fs')
const dayjs = require('dayjs')
const Web3 = require('web3')


const { WssNetId, WssNet, MaxHex, X2P,LOWB, ACCOUNT,CONFIG } = require('./config')
const ws = new Web3.providers.WebsocketProvider(WssNet)
const web3 = new Web3(ws)
const X2PContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./src/abi/x2p.json')), X2P)
const LOWBContract = new web3.eth.Contract(JSON.parse(fs.readFileSync('./src/abi/lowb.json')), LOWB)


let nonce = 0
let blockNum = 0

start()

// WebSocket 用法
// const url = process.env.NET_WSS_PROVIDER  
// const request = '{"id": 1, "method": "eth_subscribe", "params": ["newPendingTransactions"]}';  
// const wss = new WebSocket(url);

// wss.on('open', function open() {
//     wss.send(request);
// });
// wss.on('message', function incoming(data) {
//     res = JSON.parse(data)
//     console.log("res is:"+data);
//     if (res.result != null) {
//         console.log(`Subscription: ${res.result}`);
//     } else if (res.params != null && res.params["result"] != null) {
//         console.log(res.params);
//         console.log(`New pending transaction: ${res.params['result']}`);
//     } else {
//         console.log(`Unexpected: ${data}`);
//     }
// });


/**
 * 给某个地址转账。
 */
async function start() {
    console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} Ready!!! ${ACCOUNT.addr} ！`)
    blockNum = await web3.eth.getBlockNumber()
    nonce = await web3.eth.getTransactionCount(ACCOUNT.addr,'latest')
    //transcationEvent(CONFIG)                     //  监听交易对，一旦添加池子。完成授权和抢跑准备。
    watchERC20Transfers()
    //sendSignERC20Transaction(LOWBContract,1000000,CONFIG)//发送给目标钱包100 0000 LOWB
}


//监听转入金额


 //交易到目的地地址
async function transcationEvent(config) {
    console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 【${config.symbol}】开始监听：${ACCOUNT.add} 交易事件`)
    const transaction = {
        'to': process.env.TARGET_ADDRESS, // 目的地
        'value': 1000000000000000, // 0.01 ETH｜BNB
        'gas': 30000,
        'nonce': nonce,
        // optional data field to send message or execute smart contract
    };
    const signedTx = await web3.eth.accounts.signTransaction(transaction, ACCOUNT.key);

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
        if (!error) {
            console.log("🎉🎉🎉 成功交易向你的测试地址转账 ", hash, "\n 打开看看 https://testnet.bscscan.com/tx/"+hash);
        } else {
            console.log("❗❗❗报错了报错了:", error)
        }   
    });
}



//转账ERC20 
async function sendSignERC20Transaction(objContract,value,config) {
    const signedTx = await web3.eth.accounts.signTransaction({
        nonce: nonce++,
        chainId: WssNetId,
        to: LOWB,
        data:objContract.methods.transfer(process.env.TARGET_ADDRESS, value).encodeABI(),
        gasPrice: config.buyGasPrice,
        gas: config.gas
      }, ACCOUNT.key)

    //var serializedTx = signedTx.serialize();
    console.log(`Attempting to send signed tx:  ${signedTx}`);

    //var receipt = await web3.eth.sendSignedTransaction(signedTx,ACCOUNT.key);
    //console.log(`Receipt info:  ${JSON.stringify(receipt, null, '\t')}`);

    web3.eth.sendSignedTransaction(signedTx.rawTransaction, function(error, hash) {
        if (!error) {
            console.log("🎉🎉🎉 成功交易向你的测试地址转账 ", hash, "\n 打开看看 https://testnet.bscscan.com/tx/"+hash);
        } else {
            console.log("❗❗❗报错了报错了:", error)
        }   
    });
}


//监控定于订阅事件
async function getErc20TransfersByBlock(number) {
    const blockLogs = await web3.eth.getPastLogs({
        fromBlock: number,
        toBlock: number,
        address: null,
        topics: [EVENT_TRANSFER]
    });

    const transfers = [];

    for (const log of blockLogs) {
        // todo get erc20 decimals
        const DECIMALS_OF_ERC20 = null;
        const decodeData = abiDecoder.decodeLogs([log])[0];
        const from = decodeData.events[0].value;
        const to = decodeData.events[1].value;
        const raw_value = new Decimal(decodeData.events[2].value);
        const decimal = Decimal.pow(10, DECIMALS_OF_ERC20);
        const value = raw_value.div(decimal);
        console.debug(`from=${from} to=${to} value=${value} contract=${log.address}`);
        transfers.push({from, to, value, contract: log.address});
    }
    return transfers;
}

//监控最新的Block里的交易，发现如果有交易，可以触发购买，转账，交易行为。自己可以扩展延伸
function watchERC20Transfers() {
    let counter = 0;
    // Instantiate subscription object
    const subscription = web3.eth.subscribe('pendingTransactions')
  
    // Subscribe to pending transactions
    subscription.subscribe((error, result) => {

      if (error) console.log(error)

    })
      .on('data',  (txHash) => {
        setTimeout(async ()=> {
            try {
                let tx = await web3.eth.getTransaction(txHash);
                // if (tx && tx.to) { // This is the point you might be looking for to filter the address
                    // if (tx.to.toLowerCase()) {
                        console.log('TX hash: ', txHash); // transaction hash
                        console.log('TX confirmation: ', tx.transactionIndex); // "null" when transaction is pending
                        console.log('TX nonce: ', tx.nonce); // number of transactions made by the sender prior to this one
                        console.log('TX block hash: ', tx.blockHash); // hash of the block where this transaction was in. "null" when transaction is pending
                        console.log('TX block number: ', tx.blockNumber); // number of the block where this transaction was in. "null" when transaction is pending
                        console.log('TX sender address: ', tx.from); // address of the sender
                        console.log('TX amount(in Ether): ', web3.utils.fromWei(tx.value, 'ether')); // value transferred in ether
                        console.log('TX date: ', new Date()); // transaction date
                        console.log('TX gas price: ', tx.gasPrice); // gas price provided by the sender in wei
                        console.log('TX gas: ', tx.gas); // gas provided by the sender.
                        console.log('TX input: ', tx.input); // the data sent along with the transaction.
                        console.log('=====================================') // a visual separator
                    // }
                //  }
            } catch (err) {
                console.error(err);
            }
        },100)

        // try {
        //   counter++;

        //   // Instantiate web3 with HttpProvider
        //   console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} #${counter} 发现交易 txHash: " +${txHash}`)
        //   // const web3Http = new Web3(process.env.NET_WSS_PROVIDER)
  
        //   // // Get transaction details
        //   const trx = await web3.eth.getTransaction(txHash)
          

        //   if (filterTransaction(trx)) { //发现目标地址，转移lowb
        //     if (trx.value> 100000){
        //         console.log(`${dayjs().format('YYYY-MM-DD HH:mm:ss')} 发现  ${trx.value/1000000000000000000} BNB]  交易地址  +   https://testnet.bscscan.com/tx/${txHash} `);
        //         //转移掉lowb
        //         sendSignERC20Transaction(LOWB,1000000000);
        //     }
        //   }

        //   /** 开始抢 **/
          
        //   // const valid = validateTransaction(trx)
        //   // If transaction is not valid, simply return
        //   // if (!valid) return
  
        //  // console.log(' transaction   to ' + _to +  ' ...#Time:' );
  
        //   // console.log('Found incoming Ether transaction from ' + process.env.WALLET_FROM + ' to ' + process.env.WALLET_TO);
        //   // console.log('Transaction value is: ' + process.env.AMOUNT)
        //   // console.log('Transaction hash is: ' + txHash + '\n')
  
        //   // Initiate transaction confirmation
    
  
        //   //Unsubscribe from pending transactions.
        //   subscription.unsubscribe()
        // }
        // catch (error) {
        //   console.log(error)
        // }
      })
  }



  function filterTransaction(trx) {
    const toValid = trx.to !== null
    if (!toValid) return false
    
    const walletToValid = trx.to.toLowerCase() === process.env.ACCOUNT_ADDR.toLowerCase()
    //const walletFromValid = trx.from.toLowerCase() === process.env.WALLET_FROM.toLowerCase()
    //const amountValid = ethToWei(process.env.AMOUNT).equals(trx.value)
     
    console.log('钱包入账？？！' + walletToValid + '入账金额：'+ trx.value) 
  
    return walletToValid 
  }
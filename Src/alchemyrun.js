const Alchemy = require('alchemy-sdk');;

// Optional config object, but defaults to the API key 'demo' and Network 'eth-mainnet'.
const settings = {
    apiKey: 'demo', // Replace with your Alchemy API key.
    network: Network.ETH_MAINNET // Replace with your network.
  };
  

// Listen to all new pending transactions.
alchemy.ws.on('block', res => console.log(res));

// Listen to only the next transaction on the USDC contract.
alchemy.ws.once(
  {
    method: 'alchemy_pendingTransactions',
    toAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    
  },
  res => console.log(res)
);

// Remove all listeners.
alchemy.ws.removeAllListeners();
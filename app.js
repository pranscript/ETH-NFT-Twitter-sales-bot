
const { createAlchemyWeb3 } = require('@alch/alchemy-web3');
const { ethers } = require('ethers');
const retry = require('async-retry');
const _ = require('lodash');
const { markets } = require('./markets.js');
const { aggregators } = require('./aggregators.js');
const { getTokenData, getSeaportSalePrice, getUsername, getUSDValue, getStats } = require('./utils.js');
const { currencies } = require('./currencies.js');
const { transferEventTypes, saleEventTypes } = require('./log_event_types.js');
const { threadTweetWithImage, multiSaleTweetWithImage, getMediaID } = require('./tweet');
const abi = require('./abi.json');
const rarity = require('./rarity.json');
const Queue = require('queue-fifo');
const singleSaleQ = new Queue()
const multiSaleQ = new Queue()
const events = require('events');
require('dotenv').config();

// connect to Alchemy websocket
const web3 = createAlchemyWeb3(
  `wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
);

let lastTransactionHash;

async function monitorContract() {
  
  console.log("Started monitoring ethereum events");
  const contract = new web3.eth.Contract(abi, process.env.CONTRACT_ADDRESS);

  //Test transaction for both individual and sweep. It will insert this the first time program is run. 
  //singleSaleQ.enqueue({'tokens':[1747],'transactionHash':'0x8a0f8c886b8a66fd2b76383b0a1f83fc1bb415e3e8f43301bee659a404960e7c','totalPrice':0.33,'currency':{name: 'ETH',decimals: 18,threshold: 1,},'market':{name: 'Opensea ⚓️',site: 'https://opensea.io/assets/'},'buyer': '0x0f7776F7E48814923a967FaE5CE6F612eAB4e4BD', 'seller': '0x8E8A152Ea0eF5324307A37443966f7B815A7aB77'});
  //multiSaleQ.enqueue({'tokens':[1717,3382,92,5925,3603,3322],'transactionHash':'0x00340b91ecac9f73d562fb1350e8b5a50cd5363aa3df0eaf4c3e2989f3992893','totalPrice':2.59,'currency':{name: 'ETH',decimals: 18,threshold: 1,},'market':{name: 'Opensea ⚓️',site: 'https://opensea.io/assets/'},'buyer': '0x2B7BDb4aE3f24ACD1d32D456Dee034b6d2184d59', 'seller': '0x8E8A152Ea0eF5324307A37443966f7B815A7aB77'});
  
  contract.events
    .Transfer({})
    .on('connected', (subscriptionId) => {
      console.log(subscriptionId);
    })
    .on('data', async (data) => {
      const transactionHash = data.transactionHash.toLowerCase();

      //ct duplicate transaion - skip process
      if (transactionHash == lastTransactionHash) {
        return;
      }

      lastTransactionHash = transactionHash;

      // attempt to retrieve the receipt, sometimes not available straight away
      const receipt = await retry(
        async (bail) => {
          const rec = await web3.eth.getTransactionReceipt(transactionHash);

          if (rec == null) {
            throw new Error('receipt not found, try again');
          }

          return rec;
        },
        {
          retries: 5,
        }
      );
      
      let currency = {
        name: 'ETH',
        decimals: 18,
        threshold: 1,
      };
      let tokens = [];
      let totalPrice = 0;
      let buyer;
      let seller;
      let market;

      const recipient = receipt.to.toLowerCase();
      if(!(recipient in aggregators) && !(recipient in markets)) return

      for (let log of receipt.logs) {
        const logAddress = log.address.toLowerCase();

        if (logAddress in currencies) {
          currency = currencies[logAddress];
        }

        if (log.data == '0x' && transferEventTypes.includes(log.topics[0]) && logAddress == process.env.CONTRACT_ADDRESS.toLowerCase()  ) {
            const tokenId = web3.utils.hexToNumberString(log.topics[3]);
            buyer = ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2]).toString();
            seller = ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1]).toString();
            tokens.push(tokenId);
          }

        if(recipient in aggregators){
            if(logAddress in markets){
                market = _.get(markets, logAddress);
                if (saleEventTypes.includes(log.topics[0])) {
                    const decodedLogData = web3.eth.abi.decodeLog(
                      market.logDecoder,
                      log.data,
                      []
                    );
          
                    if (market.name == 'Opensea ⚓️') {
                      totalPrice += Number(getSeaportSalePrice(decodedLogData))
                    } else if (market.name == 'X2Y2 ⭕️') {
                      totalPrice += Number(ethers.utils.formatUnits(
                        decodedLogData.amount,
                        currency.decimals
                      ));
                    } else if (market.name == 'LooksRare 👀💎'){
                      totalPrice += Number(ethers.utils.formatUnits(
                        decodedLogData.price,
                        currency.decimals
                      ));
                    } else if (market.name == 'blur'){
                      totalPrice += Number(ethers.utils.formatUnits(
                        decodedLogData.sell.price,
                        currency.decimals
                      ));
                    } else {
                       totalPrice += Number(ethers.utils.formatUnits(
                        decodedLogData.price,
                        currency.decimals
                      ));
                    }
                  }
            }

        }else if (recipient in markets){
            market = _.get(markets, recipient);
            if (logAddress == recipient && saleEventTypes.includes(log.topics[0])) {
                const decodedLogData = web3.eth.abi.decodeLog(
                  market.logDecoder,
                  log.data,
                  []
                );
      
                if (market.name == 'Opensea ⚓️') {
                  totalPrice += Number(getSeaportSalePrice(decodedLogData));
                } else if (market.name == 'X2Y2 ⭕️') {
                  totalPrice += ethers.utils.formatUnits(
                    decodedLogData.amount,
                    currency.decimals
                  );
                } else if (market.name == 'blur'){
                  totalPrice += Number(ethers.utils.formatUnits(
                    decodedLogData.sell.price,
                    currency.decimals
                  ));
                } else {
                  totalPrice += Number(ethers.utils.formatUnits(
                    decodedLogData.price,
                    currency.decimals
                  ));
                }
              }
            }
        }

        tokens = _.uniq(tokens);
        if(tokens.length>1){
            console.log("Sweep")
            multiSaleQ.enqueue({'tokens':tokens,'transactionHash':transactionHash,'totalPrice':totalPrice,'currency':currency,'market':market,'buyer': buyer, 'seller': seller});
        }else{
            console.log("Individual Sale")
            if(process.env.IS_RARITY_DATA == true && process.env.SET_RARITY == true && parseInt(rarity[tokens[0]]) > process.env.RARITY){
              console.log("Individual sale above minimum rarity set. Not processing");
              return
            }else if ( (currency.name === 'ETH' && process.env.MIN_ETH_PRICE >totalPrice ) || (currency.name === 'WETH' && process.env.MIN_WETH_PRICE >totalPrice )){
              console.log("Individual sale below minimum price set. Not processing");
              return
            }
            singleSaleQ.enqueue({'tokens':tokens,'transactionHash':transactionHash,'totalPrice':totalPrice,'currency':currency,'market':market,'buyer': buyer, 'seller': seller});
        }
      
    })
    .on('changed', (event) => {
      console.log('change');
    })
    .on('error', (error, receipt) => {
      // if the transaction was rejected by the network with a receipt, the second parameter will be the receipt.
      console.error(error);
      console.error(receipt);
    });
}


const singleSaleEmitter  = new events.EventEmitter() 
singleSaleEmitter.on('processNextSale', async () => {
    console.log("Checking for Individual Sale ..");    
    if (!singleSaleQ.isEmpty()){ 
        console.log("Found!! Processing Individual Sale")   
        let data = singleSaleQ.dequeue();
        let USDValue = { amount:0 };
        if(data['currency'].name === 'ETH' || data['currency'].name === 'WETH'){
            USDValue = await getUSDValue(data['currency'].name);
        }
        await getTokenData(data['tokens'][0]).then(tokenData => {
          if(tokenData !== 'error'){
            console.log("Successfully fetched NFT Metadata");
            let tweetText = `🤖 ${_.get(tokenData,'assetName',`#` + data['tokens'][0])} bought for ${(+data['totalPrice']).toFixed(3)} ${data['currency'].name} ${data['currency'].name === 'ETH' || data['currency'].name === 'WETH'? `($${(+(USDValue.amount*data['totalPrice'])).toFixed(0)}) `: ``}${process.env.IS_RARITY_DATA == true?`\b🎯 Rarity - ${rarity[data['tokens'][0]]}/${process.env.TOTAL_NFT}` :``}\n#mekaverse #gundam #NFTJapan #mecha\b${data['market'].site}${process.env.CONTRACT_ADDRESS}/${data['tokens'][0]}`
            threadTweetWithImage(tweetText,_.get(tokenData, 'image_url'), data['buyer'], data['seller'], data['tokens'][0]);
          }
        })
    }
})


const multiSaleEmitter = new events.EventEmitter() 
multiSaleEmitter.on('processMultiSale', async () => {
  console.log("Checking for Sweep .."); 
  let buyerName=null;
  let statsBuyer= {
    coilBalance: 0,
    nftValue: 0,
    labels:[]
    };
  if (!multiSaleQ.isEmpty()){ 
    console.log("Found Sweep transaction!! Processing Sweep") 
    let data = multiSaleQ.dequeue();
    let USDValue = 0;
    if(data['currency'].name === 'ETH' || data['currency'].name === 'WETH'){
      USDValue = await getUSDValue(data['currency'].name);
    }
    buyerName = await getUsername(data['buyer']); 
    statsBuyer = await getStats(data['buyer']);

    let tweetText =` ${data['tokens'].length} Mekas bought for ${(+data['totalPrice']).toFixed(3)} ${data['currency'].name} ${data['currency'].name === 'ETH' || data['currency'].name === 'WETH'? `($${(+(USDValue.amount*data['totalPrice'])).toFixed(0)})`: ``}`;
    let mediaID = [];
    await getMediaID(data['tokens']).then(res => {
                mediaID = res;
                multiSaleTweetWithImage(`${tweetText}\n💎 Buyer: ${buyerName.username == null? data['buyer'].substring(0,8):buyerName.username}\b`+
                    `${statsBuyer.coilBalance ==0?``:`\b💵 Wallet Balance: ${(+statsBuyer.coilBalance).toFixed(3)} ETH ($${(+(USDValue.amount*statsBuyer.coilBalance)).toFixed(0)})`}\b`+
                    `${statsBuyer.nftValue ==0?``:`\b💰 NFT Portfolio Value: ${(+statsBuyer.nftValue).toFixed(3)} ETH ($${(+(USDValue.amount*statsBuyer.nftValue)).toFixed(0)})`}\n`+
                    `#mekaverse #gundam #NFTJapan #mecha\b`+
                    `https://etherscan.io/tx/${data['transactionHash']}`
                  ,mediaID) 
              })
            }
})

// initate websocket connection
monitorContract();

// initiate intervals
setInterval( () => singleSaleEmitter.emit('processNextSale'), process.env.DELAY) 
setInterval( () => multiSaleEmitter.emit('processMultiSale'), process.env.DELAY*5) 
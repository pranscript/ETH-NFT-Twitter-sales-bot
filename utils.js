
const axios = require('axios');
const retry = require('async-retry');
const _ = require('lodash');
const { ethers } = require('ethers');
require('dotenv').config();
const { currencies } = require('./currencies.js');

function _reducer(previous, current) {
  const currency = currencies[current.token.toLowerCase()];

  if (currency !== undefined) {
    const result =
      previous +
      Number(ethers.utils.formatUnits(current.amount, currency.decimals));

    return result;
  } else {
    return previous;
  }
}

function getSeaportSalePrice(decodedLogData) {
  const offer = decodedLogData.offer;
  const consideration = decodedLogData.consideration;

  const offerSideNfts = offer.some(
    (item) =>
      item.token.toLowerCase() === process.env.CONTRACT_ADDRESS.toLowerCase()
  );

  // if nfts are on the offer side, then consideration is the total price, otherwise the offer is the total price
  if (offerSideNfts) {
    const totalConsiderationAmount = consideration.reduce(_reducer, 0);

    return totalConsiderationAmount;
  } else {
    const totalOfferAmount = offer.reduce(_reducer, 0);

    return totalOfferAmount;
  }
}

async function getTokenData(tokenId) {
  try {
    const assetName = await retry(
      async (bail) => {
        // retrieve metadata for asset from looksrare
        if(process.env.IS_OPENSEA){
          const response = await axios.get(
            `https://api.opensea.io/api/v1/asset/${process.env.CONTRACT_ADDRESS}/${parseInt(tokenId)}`,
            {
              headers: {
                'X-API-KEY': process.env.X_API_KEY,
              },
            }
          );
  
          const data = response.data;
  
          return {
            assetName: _.get(data, 'name'),
            image_url: _.get(data, 'image_url')
          };
        }else{
          const response = await axios.get(
            `https://api.looksrare.org/api/v1/tokens?collection=${process.env.CONTRACT_ADDRESS}&tokenId=${parseInt(tokenId)}`
          );

          const data = response.data.data

          return {
              assetName: _.get(data, 'name'),
              image_url: _.get(data, 'imageURI')
          };
        }
      }
      ,
      {
        retries: 1,
        minTimeout: 4000
      }
    );

    return assetName;
  } catch (error) {
    console.error("API Error");
    return 'error'
  }
}

// get username from opensea
async function getUsername(buyer) {
  try {
    const assetName = await retry(
      async (bail) => {
        const response = await axios.get(
          `https://api.opensea.io/api/v1/user/${buyer}`
        );
        
        const data = response.data;
        
        return {
            username: _.get(data, 'username')
        };  
      },
      {
        retries: 0
      }
    );

    return assetName;
  } catch (error) {
        return {
            username: null
        };
  }
}

// Get ETH-USD Value 
async function getUSDValue(currency) {
  try {
    const assetName = await retry(
      async (bail) => {
        const response = await axios.get(
          `https://api.coinbase.com/v2/exchange-rates?currency=${currency}`
        );
        
        const data = response.data.data.rates.USD;
        
        return {
            amount: data
        };  
      },
      {
        retries: 0
      }
    );

    return assetName;
  } catch (error) {
        console.log("Error in fetching USD value")
  }
}

// get address stats 
async function getStats(address) {
  try {
    const assetName = await retry(
      async (bail) => {
        const response = await axios.get(
          `https://rutherford.5.dev/api/scores/${address}`
          ,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + process.env.Intelli,
            },
          }
        );
        
        const data = response.data;

        return {
            coilBalance: _.get(data.portfolioStats, 'coinPortfolioValue'),
            nftValue: _.get(data.portfolioStats, 'collectiblePortfolioValue'),
            labels: _.get(data, 'labels')
        };  
      },
      {
        retries: 0
      }
    );

    return assetName;
  } catch (error) {
        return {
            coilBalance: 0,
            nftValue: 0,
            labels: []
        };
  }
}

module.exports = {
  getSeaportSalePrice: getSeaportSalePrice,
  getTokenData: getTokenData,
  getUsername:getUsername,
  getUSDValue:getUSDValue,
  getStats:getStats
};

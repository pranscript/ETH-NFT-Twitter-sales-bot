# ETH NFT Twitter Sales Bot 🤖

 Monitors NFT sales through Ethereum logs, fetches metadata from either Looksrare API or Opensea API and posts it on Twitter.

## Live Demo

[Mekaverse Sales Bot](https://twitter.com/botMeka)

## Marketplace

- Opensea
- Looksrare
- X2Y2
- Blur
- Gem
- Genie
- Element

## Features

- Supports Opensea API and Looksrare API
- Supports rate limiting
- Supports both individual as well as sweep sales.
- Supports Opensea's private trades
- Support Blur Bid sales
- Supports Opensea's Seaport 1.4
- Supports rarity conditions
- Supports minimum price conditions

## How to run

- Star the repo for additional Karma, clone it and then run ```npm install```
- Enter details in ```.env``` file (More information is in ```.env``` file too)
  - Twitter API keys (mandatory)
  - ``` CONTRACT_ADDRESS``` - Collection's contract address (mandatory)
  - ``` ALCHEMY_API_KEY``` - [Alchemy API](https://www.alchemy.com/) (mandatory)
  - ``` IS_OPENSEA```  - True or False if you want to use Opensea's API (optional, default is Looksrare's API)
  - ```X_API_KEY``` - Opensea's API key (mandatory if ```IS_OPENSEA=true```)
  - ``` IS_RARITY_DATA``` - True or False if you have put your rarity data inside ```rarity.json``` (optional)
  - ``` SET_RARITY``` - True or False if you want to put rarity conditions while processing transactions (optional)
  - ``` RARITY``` - Rarity of NFT above which sales are not processed (must if ``` SET_RARITY=true```)
  - ``` TOTAL_NFT``` - Total number of NFTs in the collection (mandatory)
  - ``` MIN_ETH_PRICE``` & ``` MIN_WETH_PRICE``` - Conditional MIN and MAX transaction value below which transactions are not processed (optional, only checks values for individual sales)
  - ``` Delay``` - Delay in processing (mandatory, default value is optimum)
  - ``` OPENSEA_SLUG``` - Collection name in Opensea's URL of your project (mandatory)
  - ``` TOKEN_NAME``` - NFT token name you want to put in the tweets (mandatory)
  - ``` HASHTAGS``` - Hashtags to put in the tweets (optional)
  - ``` IS_SUBTWEET``` - True or false if you need extra info in the subtweet (optional)
  - ``` INTELLI``` - [2.5Intelligence](https://2.5.dev/) (mandatory if ``` IS_SUBTWEET = true```)
  - ``` NFTGO``` - [NFTGO](https://nftgo.io/) (mandatory if ``` IS_SUBTWEET = true```)

- Replace ```abi.json``` data with your raw data
  - Go to Etherscan, search collection's contract, then contract tab, scroll down to "Contract ABI". Export ABI as RAW/Text format
  - Copy and paste it inside ```abi.json``` file

- Replace ```rarity.json``` data with your data in same format (optional)
- To run locally, ``` node app.js ```
- To run on heroku, choose basic $7 Dyno in worker mode (no web), enter all ```.env``` values (case sensitive) in heroku config vars inside settings and then follow heroku deploy method by using these commands
  - ```heroku login```
  - ```git add .```
  - ```git commit -m "commit"```
  - ```git push heroku master```
  - ```heroku logs --tail```

## Limits to remember

- Opensea API limit - 4 requests / sec
- Looksrare API Limit - 2 requests / sec
- Twitter Post tweet limits - 300 tweets / 3 hours
  - Subtweet is counted too

- Alchemy API limits - Free tier enough to not worry about
- NFTGO - 5 requests / sec

## Example Images

![Individual Sale](https://raw.githubusercontent.com/pranscript/ETH-NFT-Twitter-sales-bot/master/img/individualSale.jpg)

![Subtweet](https://raw.githubusercontent.com/pranscript/ETH-NFT-Twitter-sales-bot/master/img/subtweet.jpg)

![Sweep Sale](https://raw.githubusercontent.com/pranscript/ETH-NFT-Twitter-sales-bot/master/img/sweep.jpg)


## Credits and Acknowledgments

This repo is a modification of repos [NFT Sales Twitter Bot](https://github.com/dsgriffin/nft-sales-twitter-bot) and [Ethereum NFT Sales Bot](https://github.com/kenryu42/ethereum-nft-sales-bot).

[dsgriffin](https://github.com/dsgriffin) 
[Kenryu42](https://github.com/kenryu42) 

## License 📃

This code is licensed under the [ISC License](https://choosealicense.com/licenses/isc/).

Please include proper attribution to my original repo if you fork, modify or utilize this repo in any way. Thank you!

## Contact to deploy

[pran_eth](https://twitter.com/pran_eth) - Though the deployment is straightforward, if you need help then you can contact me on my twitter.

## Donations

ETH/BSC - 0x64Dc82955841fD5Ef8155D5cE0b12a77DEb88879

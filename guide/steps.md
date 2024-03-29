## How to run

- Star the repo for additional Karma, clone it and then run ```npm install```

- Replace ```abi.json``` data with your raw data
  - Go to Etherscan, search collection's contract, then contract tab, scroll down to "Contract ABI". Export ABI as RAW/Text format
  - Copy and paste it inside ```abi.json``` file
  
- Enter details in ```.env``` file (More information is in ```.env``` file too)
  - Mandatory Parameters
    - Twitter API keys (mandatory)
    - ``` CONTRACT_ADDRESS``` - Collection's contract address (mandatory)
    - ``` ALCHEMY_API_KEY``` - [Alchemy API](https://www.alchemy.com/) (mandatory)
    - ``` TOTAL_NFT``` - Total number of NFTs in the collection (mandatory)
    - ``` TOKEN_NAME``` - NFT token name you want to put in the tweets (mandatory)
    - ``` Delay``` - Delay in processing (mandatory, default value is optimum)
    - ``` OPENSEA_SLUG``` - Collection name in Opensea's URL of your project (mandatory)
  
- Run ``` node app.js ```

  

### Additional settings 

- Optional Parameters
  - ``` IS_OPENSEA```  - True or False if you want to use Opensea's API (optional, default is Looksrare's API)
  - ```X_API_KEY``` - Opensea's API key (mandatory if ```IS_OPENSEA=true```)
  - ``` IS_RARITY_DATA``` - True or False if you have put your rarity data inside ```rarity.json``` (optional)
  - ``` SET_RARITY``` - True or False if you want to put rarity conditions while processing transactions (optional)
  - ``` RARITY``` - Rarity of NFT above which sales are not processed (must if ``` SET_RARITY=true```)
  - ``` MIN_ETH_PRICE``` & ``` MIN_WETH_PRICE``` - Conditional MIN and MAX transaction value below which transactions are not processed (optional, only checks values for individual sales)
  - ``` HASHTAGS``` - Hashtags to put in the tweets (optional)
  - ``` IS_SUBTWEET``` - True or false if you need extra info in the subtweet (optional)
  - ``` INTELLI``` - [2.5Intelligence](https://2.5.dev/) (mandatory if ``` IS_SUBTWEET = true```)
  - ``` NFTGO``` - [NFTGO](https://nftgo.io/) (mandatory if ``` IS_SUBTWEET = true```)
- Replace ```rarity.json``` data with your data in same format (optional)

### Deploy on cloud

- To run on heroku, choose basic $7 Dyno in worker mode (no web), enter all ```.env``` values (case sensitive) in heroku config vars inside settings and then follow heroku deploy method by using these commands
  - ```heroku login```
  - ```git add .```
  - ```git commit -m "commit"```
  - ```git push heroku master```
  - ```heroku logs --tail```
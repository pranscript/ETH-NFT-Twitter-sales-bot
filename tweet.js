const twit = require('twit');
const axios = require('axios');
const _ = require('lodash');
const Queue = require('queue-fifo');
const singleSaleQ = new Queue()
const events = require('events');
require('dotenv').config();
const { getUsername, getStats, getTokenData, getFlipped} = require('./utils.js');



const twitterConfig = {
    consumer_key: process.env.CONSUMER_KEY,
    consumer_secret: process.env.CONSUMER_SECRET,
    access_token: process.env.ACCESS_TOKEN_KEY,
    access_token_secret: process.env.ACCESS_TOKEN_SECRET,
};


const twitterClient = new twit(twitterConfig);

async function threadTweetWithImage(mainTweetText, imageUrl, buyer, seller, tokenID, isSubtweet) {

    // Processing image
    const processedImage = await getBase64(imageUrl);

    let subTweetText;
    if(isSubtweet === 'true'){
        // Fetching buyer and seller stats from API by https://2.5.dev/ 
        const statsBuyer = await getStats(buyer)
        const statsSeller = await getStats(seller)

        // Fetching opensea username
        const buyerName = await getUsername(buyer);
        const sellerName = await getUsername(seller);

        // Fetching data from nftgo

        const nftMetadata =  await getFlipped(); 

        let buyerLabel = ``;
        let sellerLabel = ``;
        try{
            statsBuyer.labels.forEach(element => {
                if(element.name === 'whale') {
                    buyerLabel = buyerLabel + `🐳`
                    if(element.name === 'smart-money') buyerLabel = buyerLabel + '🧠'
                    else if(element.name === 'paperhands') buyerLabel = buyerLabel + '🔃'
                }else{
                    if(element.name === 'smart-money') buyerLabel = buyerLabel + '🧠'
                    if(element.name === 'paperhands') buyerLabel = buyerLabel + '🔃'
                }  
            });
        }catch(error){
            console.log("Error in processing buyer stats")
        }
        try{
            statsSeller.labels.forEach(element => {
                if(element.name === 'whale') {
                    sellerLabel = sellerLabel + `🐳`
                    if(element.name === 'smart-money') sellerLabel = sellerLabel + '🧠'
                    else if(element.name === 'paperhands') sellerLabel = sellerLabel + '🔃'
                }else{
                    if(element.name === 'smart-money') sellerLabel = sellerLabel + '🧠'
                    if(element.name === 'paperhands') sellerLabel = sellerLabel + '🔃'
                }
            });
        }catch(error){
            console.log("Error in processing seller stats")
        }
   
    // forming subtweet text 
    subTweetText = `Buyer: ${buyerName.username == null? buyer.substring(0,8):buyerName.username} ${buyerLabel}
\bSeller: ${sellerName.username == null? seller.substring(0,8):sellerName.username} ${sellerLabel}
\b${nftMetadata.flippedCount!=='unknown'?`Flipped: ${nftMetadata.flippedCount + 1} times`:""}`
   
}
    // uploading image to twitter
    twitterClient.post('media/upload', { media_data: processedImage }, (error, media, response) => {
        if (!error) {
            const tweet = {
                status: mainTweetText,
                media_ids: [media.media_id_string]
            };
            
            // tweeting main tweet text with image
            twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
                if (!error) {
                    console.log(`Successfully tweeted main tweet: ${mainTweetText}`);
                    if(isSubtweet == 'true'){
                        const subTweet = {
                            status: subTweetText,
                            in_reply_to_status_id: tweet.id_str,
                            auto_populate_reply_metadata: true
                        };
    
                        // tweeting subtweet text
                        twitterClient.post('statuses/update', subTweet, (error, subTweet, response) => {
                            if (!error) {
                                console.log(`Successfully tweeted subtweet: ${subTweetText}`);
                            } else {
                                console.log('Error in tweeting subtweet');
                            }
                        });
                    }
                } else {
                    console.log('Error in tweeting main tweet');
                }
            });
        } else {
            console.error("Error in uploading individual sale image");
            
        }
    });
}

async function multiSaleTweetWithImage(tweetText, mediaID) {
    const tweet = {
        status: tweetText,
        media_ids: mediaID
    };

    twitterClient.post('statuses/update', tweet, (error, tweet, response) => {
        if (!error) {
            console.log(`Successfully tweeted sweep tweet: ${tweetText}`);
        }else {
            console.error(error);
        }
    })
}


async function getMediaID(tokens) {
    let interval = 0;
    let flag = false;
    let mediaID = [];
    let length = tokens.length>4? 4:tokens.length;
    for (let i = 0; i < length; i++) {
        singleSaleQ.enqueue(tokens[i]);
    }

    console.log("Processing Sweep images");
    const singleSaleEmitter = new events.EventEmitter()
    singleSaleEmitter.on('processNextSale', async () => {
        
        if (!singleSaleQ.isEmpty()){ 
          let data = singleSaleQ.dequeue();
          console.log("Fetching next image link");
          await getTokenData(data).then(async (tokenData) => {
                let imageUrl = _.get(tokenData, 'image_url','false' )
                if(imageUrl !== 'false'){
                    let processedImage = await getBase64(imageUrl);
                    twitterClient.post('media/upload', { media_data: processedImage }, (error, media, response) => {
                        if (!error) {
                            mediaID.push(media.media_id_string);
                            console.log("Image uploaded successfully");
                        } else {
                            console.log("Error while uploading image");
                        }
                    });
                }
            }).catch(error =>{
                console.log("Error in fetching image link");
            })
        }else{
            console.log("Processed all transactions in Sweep");
            flag=true;
        }
    });

    const until = () =>
        new Promise((resolve) => {
                interval = setInterval( () => {
                if (flag == true) {
                    clearInterval(interval);     
                    resolve(true);                
                }
                singleSaleEmitter.emit('processNextSale');
                }, process.env.DELAY/4)
            }
    );

    await until();
    return mediaID;
}


function getBase64(url) {
        return axios.get(url, { responseType: 'arraybuffer'}).then(response => {
            if(response.status == 200){
                console.log("Successfully fetched and processed image")
                return Buffer.from(response.data, 'binary').toString('base64')
                }
                else{
                    throw "not 200"
                }
            }).catch(error =>{
                console.log("Error in processing image");
            })
}


module.exports = {
    threadTweetWithImage: threadTweetWithImage,
    multiSaleTweetWithImage:multiSaleTweetWithImage,
    getBase64:getBase64,
    getMediaID:getMediaID
};
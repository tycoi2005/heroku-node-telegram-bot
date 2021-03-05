const CoinMarketCap = require('coinmarketcap-api')
 
const apiKey = 'b92a5a15-f843-448e-8fcf-1944d84a3841'
const cmc = new CoinMarketCap(apiKey)

cmc.checkSymbol = function (coinCode){
    console.log("cmc::checkSymbol ", coinCode)

    return cmc.getIdMap({symbol: coinCode}).then(results =>{
        
        let htmlString = "<b>Coincode: " + coinCode + " detail on cmc </b>\n";

        if (!results || !results.data){
            console.log("symbol not found on cmc: ", coinCode)
            return
        }
        let data = results.data;
        for (let i =0; i< data.length; i++){
            let item = data[i];
            console.log(item)
            let cmcurl = "https://coinmarketcap.com/currencies/" + item.slug+ "/markets/"
            htmlString += "<a href=\"" + cmcurl + "\" target=\"_blank\">" + item.name + " on Coinmarketcap</a>\n"
            let platform = item.platform;
            if (platform && platform.name == "Ethereum"){
                let token_address = platform.token_address;
                let uniswapurl = "https://app.uniswap.org/#/swap?outputCurrency=" + token_address;
                htmlString += "<a href=\"" + uniswapurl + "\" target=\"_blank\"> Swap " + item.name + " on Uniswap </a>\n"
            }
            if (platform && platform.name == "Binance Smart Chain"){
                let token_address = platform.token_address;
                let pancakeswapurl = "https://exchange.pancakeswap.finance/#/add/0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56/" + token_address;
                htmlString += "<a href=\"" + uniswapurl + "\" target=\"_blank\"> Swap " + item.name + " on Pancake </a>\n"
            }

            htmlString += "\n"
        }
        return htmlString;
    }).catch(console.error)
}

module.exports = cmc;
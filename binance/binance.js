/**
 * Created by macos on 4/16/18.
 */

const binanceapi = require('node-binance-api');
var schedule = require('node-schedule');

binanceapi.options({
    'APIKEY':process.env.BINANCE_KEY,
    'APISECRET':process.env.BINANCE_SECRET
});

var binance = function (bot){
    return {
        bot: bot,
        lastAsset : "",
        assets : [],
        mapAssets : {},
        getLastAssetBinanceUrl: function(asset){
            return '<a href="https://www.this.com/userCenter/balances.html">New Binance Coin ' + asset + '</a>'
        },
        checkNewAsset: function(){
            var self = this;
            binanceapi.account(function(response) {
                let balance = response.balances[response.balances.length -1];
                if (self.lastAsset != balance.asset){
                    self.lastAsset = balance.asset;
                    bot.sendHTML(self.getLastAssetBinanceUrl(self.lastAsset)).then(function (res) {
                        console.log("sended last asset", self.lastAsset)
                    });
                }
                console.log("check new assests --------")
                let newbalances = response.balances;
                if (self.assets.length == 0){
                    self.assets = newbalances;
                    for (var i=0; i<response.balances.length; i++){
                        let b = response.balances[i];
                        self.mapAssets[b.asset] = b;
                    }
    //               for test
    //                 self.mapAssets['WINGS'] = null;
    //                 self.assets.pop()
                } else if (self.assets.length < newbalances.length ){
                    for (var i=0; i<response.balances.length; i++){
                        let b = response.balances[i];
                        if (!self.mapAssets[b.asset]){
                            self.mapAssets[b.asset] = b;

                            bot.sendHTML( self.getLastAssetBinanceUrl(b.asset)).then(function (res) {
                                console.log("sended new asset", b)
                            });
                        } else {
                            console.log(self.mapAssets[b.asset])
                        }
                    }
                    self.assets = newbalances;
                }
            });
        },
        start: function () {
            var self = this;
            var j = schedule.scheduleJob('*/10 * * * * *', function () {
                self.checkNewAsset();
            })
        }
    }
};

module.exports = binance;
/**
 * Created by macos on 4/16/18.
 */

const binanceapi = require('node-binance-api');
var schedule = require('node-schedule');
var Config = require('../config');
var levelup = require('levelup');
var leveldown = require('leveldown');

var binancedb = levelup(leveldown('./binancedb'));
const BALANCES = "balances";

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
        updateNewAsset: function(newbalances){
            // console.log("updateNewAsset", newbalances)
            var self = this;
            let balance = newbalances[newbalances.length -1];
            newbalances = JSON.stringify(newbalances);
            binancedb.put(BALANCES,newbalances).then(balances=>{
                bot.sendHTML(self.getLastAssetBinanceUrl(balance.asset)).then(function (res) {
                    console.log("sended last asset", balance.asset)
                });
            }).catch(err=>{
                console.log("error happened", err);
            });
        },
        checkNewAsset: function(){
            var self = this;
            binanceapi.account(function(response) {
                var newbalances = response.balances;
                // console.log("newbalances length ", newbalances.length, " last item", newbalances[newbalances.length-1].asset)
                binancedb.get(BALANCES).then(oldbalances=>{
                    oldbalances = JSON.parse(oldbalances);
                    // console.log("oldbalances length ", oldbalances.length, " last item", oldbalances[oldbalances.length-1].asset)
                    var updated = false;
                    if (newbalances.length > oldbalances.length){
                        updated = true;
                        self.updateNewAsset(newbalances);
                    }

                    var map = {};
                    var isNewItem = false;

                    for (var i =0; i < oldbalances.length; i++){
                        let item = oldbalances[i];
                        let asset = item.asset;
                        map[asset] = true;
                    }
                    for (var i =0; i < newbalances.length; i++){
                        let item = newbalances[i];
                        let asset = item.asset;
                        if (!map[asset]){
                            isNewItem = true;
                            bot.sendHTML(self.getLastAssetBinanceUrl(asset)).then(function (res) {
                                console.log("sended new asset", asset)
                            });
                        }
                    }
                    if (isNewItem && !updated){
                        self.updateNewAsset(newbalances);
                    }
                    
                }).catch(err=>{
                    self.updateNewAsset(newbalances);
                })

            });
        },
        start: function () {
            var self = this;
            var j = schedule.scheduleJob(Config.timers.everyTenSeconds, function () {
                self.checkNewAsset();
            })
        }
    }
};

module.exports = binance;
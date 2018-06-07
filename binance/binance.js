/**
 * Created by macos on 4/16/18.
 */

const binanceapi = require('node-binance-api');
const cheerio = require('cheerio');
var fetchUrl = require("fetch").fetchUrl;
var schedule = require('node-schedule');
var Config = require('../config');
var levelup = require('levelup');
var leveldown = require('leveldown');
const encode = require('encoding-down')

var binancedb = levelup(encode(leveldown('./binancedb')));
const BALANCES = "balances";
const BINANCE_LISTING_NEW_URL = "https://support.binance.com/hc/en-us/sections/115000106672-New-Listings";
const LAST_LISTING_NEWS = "listing_news";
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
                    //console.log("oldbalances length ", oldbalances.length, " last item", oldbalances[oldbalances.length-1].asset)
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
        updateListingNews: function(articles){
            console.log("updateListingNews")
            var self = this;
            let last = articles.first().text();
            let second = articles.next().text();
            // last = last.toString();
            // second = second.toString();
            binancedb.put(LAST_LISTING_NEWS, last).then(rs=>{
                bot.sendHTML('<a href="https://support.binance.com/hc/en-us/sections/115000106672-New-Listings">' + last + '</a>').then(function (res) {
                    console.log("sended last news", last)
                });
            }).catch(err=>{
                console.log("error happened", err);
            });
        },
        checkLastListingNew : function(){
            var self = this;
            fetchUrl(BINANCE_LISTING_NEW_URL, function(error, meta, body){
                var doc = body.toString();
                var $ = cheerio.load(doc);
                var articles = $(".article-list-item");
                var last = articles.first().text();
                binancedb.get(LAST_LISTING_NEWS).then(lastNews=>{
                    if (lastNews != last){
                        self.updateListingNews(articles);
                    }
                    
                }).catch(err=>{
                    console.log("get error", err)
                    self.updateListingNews(articles);
                })
            });
        },
        start: function () {
            var self = this;
            
            var j = schedule.scheduleJob(Config.timers.everyTwentySeconds, function () {
                self.checkNewAsset();
            })
            
            var j1 = schedule.scheduleJob(Config.timers.everyTwentySeconds, function () {
                self.checkLastListingNew();
            })

            

        }
    }
};

module.exports = binance;
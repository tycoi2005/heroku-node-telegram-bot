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

const BINANCE_NEWS_URL = "https://www.binance.com/en/support/announcement/c-49?navId=49";
const LAST_BINANCE_NEWS = "bn_news";
binanceapi.options({
    'APIKEY':process.env.BINANCE_KEY,
    'APISECRET':process.env.BINANCE_SECRET
});

const BALANCES1 = "balances1";

var binance = function (bot){
    return {
        bot: bot,
        lastAsset : "",
        assets : [],
        mapAssets : {},
        mapSended: {},
        getLastAssetBinanceUrl: function(asset){
            return '<a href="https://www.this.com/userCenter/balances.html">New Binance Coin ' + asset + '</a>'
        },
        getLastBalanceBinanceUrl: function(asset){
            return '<a href="https://www.this.com/userCenter/balances.html">New Binance Balance ' + asset + '</a>'
        },
        updateNewBalance: function(newbalances){
            // console.log("updateNewAsset", newbalances)
            var self = this;
            newbalances = JSON.stringify(newbalances);
            binancedb.put(BALANCES1,newbalances).then(balances=>{
                console.log("updated new balances")
            }).catch(err=>{
                console.log("error happened", err);
            });
        },
        checkNewBalance: function(){
            var self = this;
            binanceapi.balance(function(newbalances) {
                // console.log("newbalances length ", newbalances.length, " last item", newbalances[newbalances.length-1].asset)
                binancedb.get(BALANCES1).then(oldbalances=>{
                    oldbalances = JSON.parse(oldbalances);
                    //console.log("oldbalances length ", oldbalances.length, " last item", oldbalances[oldbalances.length-1].asset)
                    var isNewItem = false;

                    for (let i in newbalances){
                        if (!oldbalances[i] && !self.mapSended[BALANCES1 + i]){
                            isNewItem = true;
                            self.mapSended[BALANCES1 + i] = true;
                            bot.sendHTML(self.getLastBalanceBinanceUrl(i)).then(function (res) {
                                console.log("sended new balance", i)
                            });
                        }
                    }
                    if (isNewItem){
                        self.updateNewBalance(newbalances);
                    }
                    
                }).catch(err=>{
                    self.updateNewBalance(newbalances);
                })

            });
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
                        if (!map[asset] && !self.mapSended[BALANCES + asset]){
                            isNewItem = true;
                            self.mapSended[BALANCES + asset] = true;
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
            if (!self.mapSended[last]){
                self.mapSended[last] = true;
                binancedb.put(LAST_LISTING_NEWS, last).then(rs=>{
                        console.log("updateListingNews::last news" + last)
                        bot.sendHTML('<a href="https://support.binance.com/hc/en-us/sections/115000106672-New-Listings">' + last + '</a>').then(function (res) {
                        console.log("updateListingNews::sended last news", last)
                    });
                }).catch(err=>{
                        console.log("error happened", err);
                });
            }

        },
        checkLastListingNew : function(){
            console.log("checkLastListingNew")
            var self = this;
            fetchUrl(BINANCE_LISTING_NEW_URL, function(error, meta, body){
                var doc = body.toString();
                var $ = cheerio.load(doc);
                var articles = $(".article-list-link");
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
        updateLastNews: function(articles){
            console.log("updateLastNews", articles)
            var self = this;
            let last = articles.first().text();
            let second = articles.next().text();
            // last = last.toString();
            // second = second.toString();
            if (!self.mapSended[last]){
                self.mapSended[last] = true;
                binancedb.put(LAST_BINANCE_NEWS, last).then(rs=>{
                        console.log("updateLastNews:: last news" + last)
                        bot.sendHTML('<a href="https://www.binance.com/en/support/announcement/c-49?navId=49">' + last + '</a>').then(function (res) {
                        console.log("updateLastNews:: sended last news", last)
                    });
                }).catch(err=>{
                        console.log("error happened", err);
                });
            }

        },
        checkLastNew : function(){
            console.log("checkLastNew")
            var self = this;
            fetchUrl(BINANCE_NEWS_URL, function(error, meta, body){
                var doc = body.toString();
                var $ = cheerio.load(doc);
                var articles = $(".css-1ej4hfo");
                var last = articles.first().text();

                binancedb.get(LAST_BINANCE_NEWS).then(lastNews=>{
                    if (lastNews != last){
                        self.updateLastNews(articles);
                    }
                    
                }).catch(err=>{
                    console.log("get error", err)
                    self.updateListingNews(articles);
                })
            });
        },
        start: function () {
            var self = this;
            
            // var j = schedule.scheduleJob(Config.timers.everyThirtySeconds, function () {
            //     self.checkNewBalance();
            // })

            // var j = schedule.scheduleJob(Config.timers.everyThirtySeconds, function () {
            //     self.checkNewAsset();
            // })
            
            // var j1 = schedule.scheduleJob(Config.timers.everyThirtySeconds, function () {
            //     self.checkLastListingNew();
            // })

            var j1 = schedule.scheduleJob(Config.timers.everyThirtySeconds, function () {
                self.checkLastNew();
            })

        }
    }
};

module.exports = binance;
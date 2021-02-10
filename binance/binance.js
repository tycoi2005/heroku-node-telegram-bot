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
        updateLastNews: function(articles){
            console.log("updateLastNews")
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
                    self.updateLastNews(articles);
                })
            });
        },
        start: function () {
            var self = this;
            var j1 = schedule.scheduleJob(Config.timers.everyThirtySeconds, function () {
                self.checkLastNew();
            })

        }
    }
};

module.exports = binance;
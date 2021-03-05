/**
 * Created by macos on 4/16/18.
 */
const cmc = require("../misc/cmc")
const binanceapi = require('node-binance-api');
const cheerio = require('cheerio');
var fetchUrl = require("fetch").fetchUrl;
var schedule = require('node-schedule');
var Config = require('../config');
var levelup = require('levelup');
var leveldown = require('leveldown');
const encode = require('encoding-down')

var binancedb = levelup(encode(leveldown('./binancedb')));

const BINANCE_NEWS_URL = "https://www.binance.com/en/support/announcement/c-49?navId=49";
const BINANCE_NEWS_URL_API = "https://www.binance.com/gateway-api/v1/public/cms/article/catalog/list/query?catalogId=49&pageNo=1&pageSize=3";
const LAST_BINANCE_NEWS = "bn_news";

const BINANCE_LISTED_NEWS_URL = "https://www.binance.com/en/support/announcement/c-48?navId=48";
const BINANCE_LISTED_NEWS_URL_API = "https://www.binance.com/gateway-api/v1/public/cms/article/catalog/list/query?catalogId=48&pageNo=1&pageSize=3";
const LAST_BINANCE_LISTED_NEWS = "bn_listed_news";



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
        mapSended: {},
        updateLastNews: function(key, lastitem){
            console.log("updateLastNews", key, " :: ", lastitem.code, "::", lastitem.title)
            var self = this;
            let url = "https://www.binance.com/en/support/announcement/"+ lastitem.code;
            let last = lastitem.code;
            
            if (!self.mapSended[last]){
                self.mapSended[last] = true;
                binancedb.put(key, last).then(rs=>{
                        console.log("updateLastNews:: last news" + last)
                        self.checkCoinMentioned(lastitem.title);
                        bot.sendHTML('<a href="' + url +'">' + lastitem.title + '</a>').then(function (res) {
                        console.log("updateLastNews:: sended last news", last)
                    });
                }).catch(err=>{
                        console.log("error happened", err);
                });
            }

        },
        
        checkLastNewAPI : function(key, url, open_link){
            url = url + "&rand=" + Math.random();
            console.log("checkLastNew:: ", key, " :: ", url)
            var self = this;

            fetchUrl(url, function(error, meta, body){
                var doc = JSON.parse(body.toString());
                lastitem = doc.data.articles[0]
                binancedb.get(key).then(lastNews=>{
                    if (lastNews != lastitem.code){
                        self.updateLastNews(key, lastitem);
                    }
                    
                }).catch(err=>{
                    console.log("get error", err)
                    self.updateLastNews(key, lastitem);
                })
            });
        },
        
        checkCoinMentioned : function(title) {
            console.log("Binance::checkCoinMentioned")

            let arr = title.match(/\(([^)]+)\)/)
            if (!arr) return null;

            coinCode = arr[1];
            if (!coinCode) return null;

            cmc.checkSymbol(coinCode).then(htmlString =>{
                if (!htmlString) return;
                
                bot.sendHTML(htmlString).then(function (res) {
                    console.log("Binance::checkCoinMentioned:: sended coin detail", coinCode)
                });
            }).catch(err =>{
                console.log("Binance::checkCoinMentioned get error", err)
            })
        },

        checkCoinMentionedInUniswap(coinCode){
            console.log("Binance::checkCoinMentionedInUniswap", coinCode)
            
        },

        start: function () {
            var self = this;
            var jLastestNews = schedule.scheduleJob(Config.timers.everyFiveSeconds, function () {
                let url = BINANCE_NEWS_URL_API;
                let key = LAST_BINANCE_NEWS;
                self.checkLastNewAPI(key, url) ;
            })

            var jListingNews = schedule.scheduleJob(Config.timers.everyFiveSeconds, function () {
                let url = BINANCE_LISTED_NEWS_URL_API;
                let key = LAST_BINANCE_LISTED_NEWS;
                self.checkLastNewAPI(key, url);
            })

        }
    }
};

module.exports = binance;
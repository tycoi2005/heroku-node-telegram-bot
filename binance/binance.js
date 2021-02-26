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
const BINANCE_NEWS_URL = "https://www.binance.com/en/support/announcement/c-49?navId=49";
const BINANCE_NEWS_URL_API = "https://www.binance.com/gateway-api/v1/public/cms/article/catalog/list/query?catalogId=49&pageNo=1&pageSize=25";
const LAST_BINANCE_NEWS = "bn_news";

const BINANCE_LISTED_NEWS_URL = "https://www.binance.com/en/support/announcement/c-48?navId=48";
const BINANCE_LISTED_NEWS_URL_API = "https://www.binance.com/gateway-api/v1/public/cms/article/catalog/list/query?catalogId=48&pageNo=1&pageSize=25";
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
        updateLastNews: function(key, url, last){
            console.log("updateLastNews", key, " :: ", url)
            var self = this;
            if (!self.mapSended[last]){
                self.mapSended[last] = true;
                binancedb.put(key, last).then(rs=>{
                        console.log("updateLastNews:: last news" + last)
                        bot.sendHTML('<a href="' + url +'">' + last + '</a>').then(function (res) {
                        console.log("updateLastNews:: sended last news", last)
                    });
                }).catch(err=>{
                        console.log("error happened", err);
                });
            }

        },
        
        checkLastNew : function(key, url){
            console.log("checkLastNew:: ", key, " :: ", url)
            var self = this;
            fetchUrl(url, function(error, meta, body){
                var doc = body.toString();
                var $ = cheerio.load(doc);
                var articles = $(".css-1ej4hfo");
                var last = articles.first().text();

                binancedb.get(LAST_BINANCE_NEWS).then(lastNews=>{
                    if (lastNews != last){
                        self.updateLastNews(key, url, last);
                    }
                    
                }).catch(err=>{
                    console.log("get error", err)
                    self.updateLastNews(key, url,  last);
                })
            });
        },
        
        checkLastNewAPI : function(key, url){
            console.log("checkLastNew:: ", key, " :: ", url)
            var self = this;
            let settings = { method: "Get" };

            fetchUrl(url, function(error, meta, body){
                var doc = JSON.parse(body.toString());
                last = doc.data.articles[0].title;
                binancedb.get(LAST_BINANCE_NEWS).then(lastNews=>{
                    if (lastNews != last){
                        self.updateLastNews(key, url, last);
                    }
                    
                }).catch(err=>{
                    console.log("get error", err)
                    self.updateLastNews(key, url,  last);
                })
            });
        },
        

        start: function () {
            var self = this;
            var jLastestNews = schedule.scheduleJob(Config.timers.everyTwentySeconds, function () {
                let url = BINANCE_NEWS_URL_API;
                let key = LAST_BINANCE_NEWS;
                self.checkLastNewAPI(key, url);
            })

            var jListingNews = schedule.scheduleJob(Config.timers.everyTwentySeconds, function () {
                let url = BINANCE_LISTED_NEWS_URL_API;
                let key = LAST_BINANCE_LISTED_NEWS;
                self.checkLastNewAPI(key, url);
            })

        }
    }
};

module.exports = binance;
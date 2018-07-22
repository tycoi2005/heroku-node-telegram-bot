/**
 * Created by macos on 4/16/18.
 */

const cheerio = require('cheerio');
var fetchUrl = require("fetch").fetchUrl;
var schedule = require('node-schedule');
var Config = require('../config');
var levelup = require('levelup');
var leveldown = require('leveldown');
const encode = require('encoding-down')

var fcoindb = levelup(encode(leveldown('./fcoindb')));
const BALANCES = "balances";
const FCOIN_ANNOUNCEMENTS_URL = "https://support.fcoin.com/hc/en-us/categories/360000333493-Announcements";
const LAST_LISTING_NEWS = "listing_news";
const BALANCES1 = "balances1";

var fcoin = function (bot){
    return {
        bot: bot,
        lastAsset : "",
        assets : [],
        mapAssets : {},
        mapSended: {},

        updateListingNews: function(articles){
            console.log("updateListingNews")
            var self = this;
            let last = articles.first().text();
            let second = articles.next().text();
            // last = last.toString();
            // second = second.toString();
            if (!self.mapSended[last]){
                self.mapSended[last] = true;

                fcoindb.put(LAST_LISTING_NEWS, last).then(rs=>{
                    bot.sendHTML('<a href="https://support.fcoin.com/hc/en-us/categories/360000333493-Announcements">' + last + '</a>').then(function (res) {
                    console.log("sended last news", last)
                    });
                }).catch(err=>{
                        console.log("error happened", err);
                });
            }
        },
        checkLastListingNew : function(){
            var self = this;
            fetchUrl(FCOIN_ANNOUNCEMENTS_URL, function(error, meta, body){
                var doc = body.toString();
                var $ = cheerio.load(doc);
                var articles = $(".article-list-link");
                var last = articles.first().text();
                fcoindb.get(LAST_LISTING_NEWS).then(lastNews=>{
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

            var j1 = schedule.scheduleJob(Config.timers.everyThirtySeconds, function () {
                self.checkLastListingNew();
            })

            

        }
    }
};

module.exports = fcoin;
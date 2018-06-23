/**
 * Created by macos on 4/16/18.
 */

var fetchUrl = require("fetch").fetchUrl;
var schedule = require('node-schedule');
var Config = require('../config');

var misc = function (bot){
    return {
        bot: bot,
            lastAsset : "",
            assets : [],
            mapAssets : {},       
        checkMorphHitbtcIssue : function(){
            var self = this;
            var urlMrphHitbtc = "https://api.etherscan.io/api?module=account&action=tokenbalance&contractaddress=0xb79b8636d55cdb8ea97729cbae311d6c2028af68&address=0xa12431d0b9db640034b0cdfceef9cce161e62be4&tag=latest&apikey=YourApiKeyToken";
            fetchUrl(urlMrphHitbtc, function(error, meta, body) {
                var doc = body.toString();
                var json = JSON.parse(doc);
                var result = parseInt(json.result);
                if (result > 0 ){
                    bot.sendHTML("time to buy MORPH " + result).then(function (res) {
                        console.log("sended new asset", json)
                    });
                }
                console.log(json)
            })
        } , start: function () {
            var self = this;
            
            var j1 = schedule.scheduleJob(Config.timers.everyTwentySeconds, function () {
                self.checkMorphHitbtcIssue();
            })

            

        }
    }
};

module.exports = misc;
var token = process.env.TOKEN;
const binance = require('node-binance-api');
binance.options({
    'APIKEY':process.env.BINANCE_KEY,
    'APISECRET':process.env.BINANCE_SECRET
});

var Bot = require('node-telegram-bot-api');
var bot;

const toanhd = 307822770;

if(process.env.NODE_ENV === 'production') {
  console.log("production")
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
  bot.setWebHook(null);
}

console.log('Bot server started in the ' + process.env.NODE_ENV + ' mode');

bot.onText(/^/, function (msg) {
  var name = msg.from.first_name;
  bot.sendMessage(msg.chat.id, 'Hello, ' + name + '! I am pleased to serve you!').then(function (res) {
      // { message_id: 12,
      //     from:
      //     { id: 463309037,
      //         is_bot: true,
      //         first_name: 'coin-monitor',
      //         username: 'botbiecoin_bot' },
      //     chat:
      //     { id: 307822770,
      //         first_name: 'toan',
      //         last_name: 'huynh',
      //         type: 'private' },
      //     date: 1506516731,
      //         text: 'Hello, toan!' }
    // console.log("res",res)
    // reply sent!
  });
});

var lastAsset = ""
var assets = []
var mapAssets = {}

function doSendMessage(){
    binance.account(function(response) {
        let balance = response.balances[response.balances.length -1];
        if (lastAsset != balance.asset){
            lastAsset = balance.asset;
            bot.sendMessage( toanhd , 'last Asset ----' + lastAsset).then(function (res) {
                console.log("sended last asset", lastAsset)
            });
        }
        console.log("check new assests --------")
        let newbalances = response.balances;
        if (assets.length == 0){
            assets = newbalances;
            for (var i=0; i<response.balances.length; i++){
                let b = response.balances[i];
                mapAssets[b.asset] = b;
            }
            // for test
            // mapAssets['WINGS'] = null;
            // assets.pop()
        } else if (assets.length < newbalances.length ){
            for (var i=0; i<response.balances.length; i++){
                let b = response.balances[i];
                if (!mapAssets[b.asset]){
                    mapAssets[b.asset] = b;
                    bot.sendMessage( toanhd , 'new Asset ----' + b.asset).then(function (res) {
                        console.log("sended new asset", b.asset)
                    });
                } else {
                    console.log(mapAssets[b.asset])
                }
            }
            assets = newbalances;
        }
    });

    setTimeout(doSendMessage, 10000);
}

doSendMessage()

module.exports = bot;

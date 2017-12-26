var token = process.env.TOKEN;

var Bot = require('node-telegram-bot-api');
var bot;

if(process.env.NODE_ENV === 'production') {
  bot = new Bot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
}
else {
  bot = new Bot(token, { polling: true });
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

function doSendMessage(){
    bot.sendMessage(msg.chat.id, 'doSendMessage ----').then(function (res) {

    });
}

setTimeout(doSendMessage, 1000);

module.exports = bot;

var irc = require('irc'),
    redis = require('redis'),
    swig = require('swig'),
    processors = require('./preprocess.js');

function errorLog(message) {
    console.log(message);
}

swig.init({
    autoescape: false,
    root: __dirname
});

var template = swig.compileFile('template.txt');

var channel = '##legoktm-bots-chatter';

var ircClient = new irc.Client('irc.freenode.net', 'lolrrit-wm', {
    channels: [channel]
});
ircClient.addListener('error', errorLog);

var redisClient = redis.createClient();
redisClient.addListener('error', errorLog);

function doEcho() {
    console.log('waiting');
    redisClient.brpop('lolrrit-wm', 0, function(err, reply) {
        var message = JSON.parse(reply[1]);
        if(processors[message.type]) {
            console.log(message);
            var msg = processors[message.type](message);
            if(msg) {
                var relayMsg = template.render(msg).replace(/\s+/gm, ' ');
                console.log(relayMsg);
                ircClient.say(channel, relayMsg);
            }
        }
        doEcho();
    });
}

redisClient.select(7, function() {
    doEcho();
});

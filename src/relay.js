var irc = require('irc'),
    redis = require('redis');

function errorLog(message) {
    console.log(message);
}

var channel = '##legoktm-bots-chatter';

var ircClient = new irc.Client('irc.freenode.net', 'lolrrit-wm', {
    channels: [channel]
});
ircClient.addListener('error', errorLog);

var redisClient = redis.createClient();
redisClient.addListener('error', errorLog);

redisClient.select(7, function() {
    function doEcho() {
        console.log('waiting');
        redisClient.brpop('lolrrit-wm', 0, function(err, reply) {
            console.log(err);
            console.log(reply);
            doEcho();
        });
    }
    doEcho();
});

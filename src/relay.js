var irc = require('irc'),
    redis = require('redis'),
    swig = require('swig'),
    processors = require('./preprocess.js');

function errorLog(message) {
    console.log(message);
}

var template = swig.compile("{{type}}: {{user}}, '{{message}}' [{{repo}}] {% if branch %}({{branch}}){% endif %} {% for value in approvals %}{{loop.key}}: {{value}} {% endfor %}- {{url}}");

var channel = '##legoktm-bots-chatter';

var ircClient = new irc.Client('irc.freenode.net', 'lolrrit-wm', {
    channels: [channel]
});
ircClient.addListener('error', errorLog);

var redisClient = redis.createClient();
redisClient.addListener('error', errorLog);

function formatRelay(msg) {
}

function doEcho() {
    console.log('waiting');
    redisClient.brpop('lolrrit-wm', 0, function(err, reply) {
        var message = JSON.parse(reply[1]);
        if(processors[message.type]) {
            console.log(message);
            var msg = processors[message.type](message);
            if(msg) {
                var relayMsg = template(msg);
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

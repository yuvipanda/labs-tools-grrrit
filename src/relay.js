var _ = require('underscore'),
    irc = require('irc'),
    redis = require('redis'),
    swig = require('swig'),
    processors = require('./preprocess.js'),
    yaml = require('js-yaml'),
    config = require('../config.yaml'),
    conns = require('../connections.yaml');

function errorLog(message) {
    console.log(message);
}

swig.init({
    autoescape: false,
    root: __dirname
});

var allChannels = _.keys(config.channels);

if(allChannels.indexOf(config['default-channel']) === -1) {
    allChannels.push(config['default-channel']);
}

console.log(allChannels);

function channelsForRepo(repo) {
    var channels = [];
    _.each(config.channels, function(repos, channel) {
        _.each(repos, function(repo_candidate) {
            if((new RegExp(repo_candidate)).test(repo)) {
                channels.push(channel);
            }
        });
    });
    if(!channels.length) {
        channels = [config['default-channel']]
    }
    return channels;
}

var template = swig.compileFile('template.txt');

var ircClient = new irc.Client('irc.freenode.net', config.nick, {
    channels: allChannels,
    floodProtection: true
});
ircClient.addListener('error', errorLog);

var joinedChannels = [];
function waitForChannelJoins(channel, nick, message) {
    if(nick === config.nick) {
        joinedChannels.push(channel);
        console.log("Joined " + channel);
    }
    if(joinedChannels.length === allChannels.length) {
        ircClient.removeListener('join', waitForChannelJoins);
        console.log("Joined " + joinedChannels.length + " channels. Starting relay");
        startRelay();
    }
}
ircClient.addListener('join', waitForChannelJoins);
function startRelay() {
    var redisClient = redis.createClient(conns.redis.port, conns.redis.host);
    redisClient.addListener('error', errorLog);

    function doEcho() {
        redisClient.brpop(conns.redis['queue-key'], 0, function(err, reply) {
            var message = JSON.parse(reply[1]);
            if(processors[message.type]) {
                var msg = processors[message.type](message);

                if(msg) {
                    if(conf.blacklist.indexOf(msg.user) === -1) {
                        var relayMsg = template.render(msg).replace(/\s+/gm, ' ');
                        var channels = channelsForRepo(message.change.project);
                        console.log(channels.length);
                        _.each(channels, function(channel) {
                            ircClient.say(channel, relayMsg);
                        });
                    }
                }
            }
            doEcho();
        });
    }

    redisClient.select(conns.redis.db, function() {
        doEcho();
    });
}

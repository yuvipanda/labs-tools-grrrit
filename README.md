# lorrit-wm

lorrit-wm is a simple IRC bot that listens to events from [gerrit][1]
and reports them on various IRC channels. Which repo changes report
to which channels can be configured in `config.yaml`

It is built to run on [Wikimedia ToolLabs][2], and is dependent on a
redis queue populated by the stream receiver script that is part of
[SuchABot][3].

== Running it ==

This is designed to run on the Grid Engine available on Tool Labs as 
a continuous task. There is a convenience script `run.bash` to start
the task on the Grid Engine. 

== Config Changes ==

To add more repo -> channel mappings, please edit `config.yaml`. The
repo names can be matched using regexps. The tool needs to be restarted
on SGE for the changes to take effect. Executing `run.bash` will kill
the job and start it up again.

== Dependencies ==

This is written with NodeJS, and has a few dependencies (which are all
bundled in the repo):

1. underscore.js
2. node-irc
3. redis
4. swig
5. js-yaml

== LICENSE ==

Licensed under WTFPL. See the LICENSE file for more details.

[1]: https://gerrit.wikimedia.org
[2]: http://tools.wmflabs.org
[3]: https://github.com/yuvipanda/SuchABot

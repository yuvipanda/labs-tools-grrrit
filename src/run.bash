#!/bin/bash
# Stop current job if it exists, and start a new one
jstop lolrrit-wm
sleep 2s # Stupid hack to make sure the job is killed
jsub -N lolrrit-wm -mem 1G -continuous node /data/project/lolrrit-wm/lolrrit-wm/src/relay.js

#!/bin/zsh
# Run this watch script to convert TypeScript and JSON5 in this folder (to JavaScript and JSON)
# for semi-automated / scripted app interactions. Run the unwatch script to cancel the watch.
watchman watch .
watchman -j <convertTrigger.json
watchman -j <reconvertTrigger.json
watchman watch-list

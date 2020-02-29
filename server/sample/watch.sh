#!/bin/bash
watchman watch .
watchman -j <convertTrigger.json
watchman -j <reconvertTrigger.json
watchman watch-list

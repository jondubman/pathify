#!/bin/bash
watchman watch-del .
watchman watch-del ./json5
watchman watch-del ./src
watchman watch-list

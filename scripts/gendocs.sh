#!/bin/sh
rm -rf ./build && mkdir -p ./build/apidocs && ./node_modules/.bin/yuidoc --config ./conf/yuidoc.json ./lib

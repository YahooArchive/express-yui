#!/bin/sh
echo "Running YUIDocs"
rm -rf ./build/apidocs && mkdir -p ./build/apidocs
./node_modules/.bin/yuidoc --config ./conf/yuidoc.json ./lib

#!/bin/sh
echo "Running JSLint and YUIDocs"
./node_modules/.bin/jslint ./lib/*
./node_modules/.bin/yuidoc --config ./conf/yuidoc.json ./lib

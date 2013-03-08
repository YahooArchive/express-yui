#!/bin/sh

echo "$SRC_DIR"
NPM="ynpm"
TAG="HEAD"
CD="cd $SRC_DIR/node_modules"
CLONE="git clone git@git.corp.yahoo.com:modown/modown-static.git"
CD2="cd modown-static"
CO="git checkout -b work $TAG"
INSTALL="$NPM i"
BACK="cd $SRC_DIR"

$CD

if [ -d "`pwd`/modown-static" ]; then
    echo "Removing existing modown-static/ dir"
    rm -rf "`pwd`/modown-static"
fi

$CLONE && $CD2 && $CO && $INSTALL && $BACK

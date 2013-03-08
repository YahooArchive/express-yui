#!/bin/sh

echo "Running script with arguments: $0 $@"

NPM="ynpm"
TAG="HEAD"
MYOS=`uname`

if [ $# -ge 1 ]; then
    TAG="$1"
    echo "Script will checkout TAG modown-static@$TAG"
fi

if [ "$MYOS" == "Darwin" ]; then
    NPM="npm"
fi

echo "$SRC_DIR"
TAG=
CD="cd $SRC_DIR/node_modules"
CLONE="git clone git@git.corp.yahoo.com:modown/modown-static.git"
CD2="cd modown-static"
CO="git checkout -b work $TAG"
BACK="cd $SRC_DIR"


$CD

if [ -d "`pwd`/modown-static" ]; then
    echo "Removing existing modown-static/ dir"
    rm -rf "`pwd`/modown-static"
fi

$CLONE && $CD2 && $CO && $NPM i && $BACK

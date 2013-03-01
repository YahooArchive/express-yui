#!/bin/sh
echo "Running Tests"
./node_modules/.bin/ytestrunner --root . -c --istanbul --save-coverage

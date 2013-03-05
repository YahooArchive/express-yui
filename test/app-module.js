
/*jslint node:true, nomen: true*/
/*global YUI*/

var YUI = require('yui').YUI;

YUI.add('module-A', function (Y, NAME) {
    Y.namespace('A').doIt = function () {
        Y.log('I am module A', 'info', NAME);
    };
});

YUI.add('module-B', function (Y, NAME) {
    Y.namespace('B').doIt = function () {
        Y.log('I am module B', 'info', NAME);
    };
});

YUI.add('app', function (Y, NAME) {
    'use strict';

    var shared = __dirname + '/';

    Y.applyConfig({
        useSync: true,
        groups: {
            app: {
                'module-A': {
                    path: shared + 'module-A.js',
                    requires: [ 'module-B' ]
                },
                'module-B': {
                    path: shared + 'module-B.js',
                    requires: [ ]
                }
            }
        }
    });

}, '0.0.1', { requires: [ 'model' ]});

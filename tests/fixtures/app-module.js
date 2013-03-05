
/*jslint node:true, nomen: true*/
/*global YUI*/

// var YUI = require('yui').YUI;

/*
YUI.add('module-A', function (Y, NAME) {
    // console.log('module-A loaded OK');
    Y.namespace('A').doIt = function () {
        // Y.log('I am module A', 'info', NAME);
    };
}, '0.0.1', { requires: ['module-B'] });

YUI.add('module-B', function (Y, NAME) {
    // console.log('module-B loaded OK');
    Y.namespace('B').doIt = function () {
        // Y.log('I am module B', 'info', NAME);
    };
}, '0.0.1', { requires: [] });
*/

YUI.add('app-module', function (Y, NAME) {
    'use strict';

    Y.applyConfig({
        groups: {
            app: {
                modules: {
                    'module-A': {
                        path: 'assets/js/module-A.js',
                        requires: [ 'module-B' ]
                    },
                    'module-B': {
                        path: 'assets/js/module-B.js',
                        requires: [ ]
                    }
                }
            }
        }
    });

}, '0.0.1', { requires: ['yui-base', 'loader-base', 'loader-yui3']});

/*
YUI().use('yui-base', 'loader-base', 'app', function (Y) {
    // Y.A.doIt();
});
*/

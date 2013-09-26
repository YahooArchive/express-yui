/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

"use strict";

var YUITest = require('yuitest'),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    mockery = require('mockery'),
    express = require('express'),
    mockYUIClass,
    suite,
    ExpressYUI,
    configFn;

mockYUIClass = function () {};

suite = new YUITest.TestSuite("index-test suite");

suite.add(new YUITest.TestCase({
    name: "index-test",

    setUp: function () {
        mockery.registerMock('./yui', mockYUIClass);
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        ExpressYUI = require('../../lib/index.js');
    },

    tearDown: function () {
        mockery.deregisterMock('./yui');
        mockery.disable();
    },

    "test extend": function () {
        var app = express(),
            result;
        result = ExpressYUI.extend(app);
        A.isObject(app.yui, 'express app was not extended correctly');
        A.areSame(result, app, 'extend shoud return the express app');

        // already augmented app
        app.yui = 1;
        result = ExpressYUI.extend(app);
        A.areSame(1, app.yui, 'already extended app should not be extended again');
        A.areSame(result, app, 'extend shoud return the express app');
    },

    "test app.expose": function () {
        var app = express(),
            result;
        result = ExpressYUI.extend(app);
        A.isFunction(app.expose, 'express app is not extended with express-state');
    }

}));

YUITest.TestRunner.add(suite);

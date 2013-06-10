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
    suite,
    cdn = require('../../lib/cdn');

suite = new YUITest.TestSuite("cdn-test suite");

suite.add(new YUITest.TestCase({
    name: "cdn-test",

    setUp: function () {
    },
    tearDown: function () {
        delete cdn.config;
        delete cdn.version;
    },

    "test setCoreFromCDN": function () {
        var mid,
            c = {
                baz: 1
            };

        A.isFunction(cdn.setCoreFromCDN);

        cdn.version = '3.9'; // from yui()
        cdn.config = function () {
            return c;
        };

        mid = cdn.setCoreFromCDN({
            foo: 'bar'
        });

        OA.areEqual({
            baz: 1,
            foo: 'bar',
            base: 'http://yui.yahooapis.com/3.9/',
            comboBase: 'http://yui.yahooapis.com/combo?',
            comboSep: '&',
            root: '3.9/'
        }, c, 'wrong loader config');

        A.areEqual(cdn, mid, 'cdn.setCoreFromCDN() should be chainable');
    }

}));

YUITest.TestRunner.add(suite);

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

    "test serveCoreFromCDN": function () {
        var mid,
            c = {
                baz: 1
            };

        A.isFunction(cdn.serveCoreFromCDN);

        cdn.version = '3.9'; // from yui()
        cdn.config = function () {
            return c;
        };

        mid = cdn.serveCoreFromCDN({
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

        A.areEqual(cdn, mid, 'cdn.serveCoreFromCDN() should be chainable');
    },

    "test serveGroupFromCDN": function () {
        var mid,
            c = {
                foz: 'baz',
                combine: true,
                groups: {
                    app: {
                        foo: 'foo'
                    }
                }
            };

        A.isFunction(cdn.serveGroupFromCDN);

        cdn.config = function () {
            return c;
        };

        mid = cdn.serveGroupFromCDN('app', {
            foo: 'bar'
        });

        A.areEqual(JSON.stringify({
            "foz": "baz",
            "combine": true,
            "groups": {
                "app": {
                    "foo": "bar",
                    "combine": true
                }
            }
        }), JSON.stringify(c), 'wrong loader config');

        A.areEqual(cdn, mid, 'cdn.serveGroupFromCDN() should be chainable');
    }

}));

YUITest.TestRunner.add(suite);

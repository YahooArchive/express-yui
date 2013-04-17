/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

var YUITest = require('yuitest'),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    mockery = require('mockery'),
    suite,
    cdn,
    mockUtils;

suite = new YUITest.TestSuite("cdn-test suite");

suite.add(new YUITest.TestCase({
    name: "cdn-test",

    setUp: function () {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
    },
    tearDown: function () {
        mockUtils = null;
        mockery.disable();
    },

    "test serveCoreFromCDN": function () {
        var mid,
            configCalled = false;

        cdn = require('../../lib/cdn');
        A.isFunction(cdn.serveCoreFromCDN);

        cdn.version = '3.9'; // from yui()
        cdn.config = function () {
            var args = Array.prototype.slice.call(arguments);
            configCalled = true;

            A.areEqual(2, args.length, 'utils.extend() expects only 2 arguments');
            OA.areEqual({
                base: 'http://yui.yahooapis.com/3.9/',
                comboBase: 'http://yui.yahooapis.com/combo?',
                comboSep: '&',
                root: '3.9/'
            }, args[0], 'wrong args[0]');
            OA.areEqual({foo: 'bar'}, args[1], 'wrong loaderConfig');
        };

        mid = cdn.serveCoreFromCDN({
            foo: 'bar'
        });

        A.areEqual(true, configCalled, 'yui.config() was not called');
        A.areEqual(false, mid, 'cdn.serveCoreFromCDN() should return false');

        delete cdn.config;
        delete cdn.version;
    },

    "test serveGroupFromCDN": function () {
        var mid,
            extendCalled = false;

        mockUtils = {
            extend: function () {
                var args = Array.prototype.slice.call(arguments);
                extendCalled = true;

                A.areEqual(3, args.length, 'utils.extend() expects only 3 arguments');
                OA.areEqual({foo: 'foo'}, args[0], 'wrong args[0]');
                OA.areEqual({combine: false}, args[1], 'wrong args[1]');
                OA.areEqual({foo: 'bar'}, args[2], 'wrong loaderConfig');

                return {};
            }
        };

        mockery.registerMock('./utils', mockUtils);
        cdn = require('../../lib/cdn');
        A.isFunction(cdn.serveGroupFromCDN);


        cdn.config = function () {
            return {
                foz: 'baz',
                combine: false,
                groups: {
                    app: {
                        foo: 'foo'
                    }
                }
            };
        };

        mid = cdn.serveGroupFromCDN('app', {
            foo: 'bar'
        });

        A.areEqual(true, extendCalled, 'utils.extend() was not called');
        mockery.deregisterMock('./utils');

        A.areEqual(false, mid, 'cdn.serveGroupFromCDN() should return false');

        delete cdn.config;
    }

}));

YUITest.TestRunner.add(suite);

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
    engine = require('../../lib/engine.js');

suite = new YUITest.TestSuite("modown-yui engine plugin suite");

suite.add(new YUITest.TestCase({
    name: "engine-test",

    setUp: function () {
        // nothing
    },

    tearDown: function () {
        // unregister mocks
        delete engine.getYInstance;
    },

    "test constructor": function () {
        A.isNotNull(engine, "engine require failed");
        A.isFunction(engine.engine);
    },

    "test engine": function () {
        YUITest.Mock.expect(engine, {
            method: 'getYInstance',
            args: [],
            run: function () {
                return {};
            }
        });
        var fn = engine.engine();
        A.isObject(fn);
        YUITest.Mock.verify(engine);
    },

    "test render": function () {
        engine.getYInstance = function () {
            return {
                bundleName: {
                    templates: {
                        foo: function () {
                            return 'output';
                        }
                    }
                }
            };
        };
        var fn = engine.engine(),
            value;
        fn('foo', {
            bundle: 'bundleName'
        }, function (err, data) {
            A.isNull(err);
            value = data;
        });
        A.areSame('output', value);
    },

    "test layout": function () {
        engine.getYInstance = function () {
            return {
                bundleName: {
                    templates: {
                        foo: function () {
                            return 'output';
                        },
                        bar: function (data, ctx) {
                            return data.body + '+layout';
                        }
                    }
                }
            };
        };
        var fn = engine.engine({
                defaultBundle: 'bundleName',
                defaultLayout: 'bar'
            }),
            value;
        fn('foo', function (err, data) {
            A.isNull(err);
            value = data;
        });
        A.areSame('output+layout', value);
    },

    "test invalid template": function () {
        engine.getYInstance = function () {
            return {};
        };
        var fn = engine.engine(),
            value;
        fn('foo', {
            bundle: 'bundleName'
        }, function (err, data) {
            A.isObject(err);
            value = data;
        });
        A.isUndefined(value);
    }

}));

YUITest.TestRunner.add(suite);

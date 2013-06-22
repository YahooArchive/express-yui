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
    view = require('../../lib/view.js');

suite = new YUITest.TestSuite("express-yui view plugin suite");

suite.add(new YUITest.TestCase({
    name: "view-test",

    setUp: function () {
        // nothing
    },

    tearDown: function () {
        // unregister mocks
        delete view.use;
        delete view.YUI;
    },

    "test constructor": function () {
        A.isNotNull(view, "view require failed");
        A.isFunction(view.view);
    },

    "test view": function () {
        YUITest.Mock.expect(view, {
            method: 'use',
            callCount: 0 // we should get Y in lazy mode when calling render
        });
        var fn = view.view();
        A.isObject(fn);
        YUITest.Mock.verify(view);
    },

    "test render": function () {
        view.use = function () {
            return {
                Template: {
                    _cache: {
                        'bundleName/foo': function (ctx, callback) {
                            return 'output';
                        }
                    }
                }
            };
        };
        var ViewClass = view.view(),
            value;
        new ViewClass('foo').render({
            bundle: 'bundleName'
        }, function (err, data) {
            A.isNull(err);
            value = data;
        });
        A.areSame('output', value);
    },

    "test layout": function () {
        view.use = function () {
            return {
                Template: {
                    _cache: {
                        'bundleName/foo': function (ctx, callback) {
                            return 'output';
                        },
                        'bundleName/bar': function (ctx, callback) {
                            return ctx.outlet + '+layout';
                        }
                    }
                }
            };
        };
        var ViewClass = view.view({
                defaultBundle: 'bundleName',
                defaultLayout: 'bar'
            }),
            value;
        new ViewClass('foo').render({}, function (err, data) {
            A.isNull(err);
            value = data;
        });
        A.areSame('output+layout', value);
    },

    "test invalid template": function () {
        view.use = function () {
            return {};
        };
        var ViewClass = view.view({});
        A.throwsError('Error trying to access template `foo` from bundle `bundleName`; make sure the template was compiled correctly.', function () {
            new ViewClass('foo').render({
                bundle: 'bundleName'
            }, function (err, data) {
                A.isObject(err);
                A.isUndefined(data);
            });
        });
    }

}));

YUITest.TestRunner.add(suite);

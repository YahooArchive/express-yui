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
    mockYUI,
    mockExpress,
    mockExpressState,
    suite,
    ExpressYUI,
    configFn;

mockYUI = {
    path: function () {
        return "/foo/bar";
    },
    YUI: {
        version: '1.0'
    }
};
mockExpress = {
    application: {
        defaultConfiguration: function () {}
    }
};
mockExpressState = {
    extend: function (app) {
        return app;
    }
};

suite = new YUITest.TestSuite("yui-test suite");

suite.add(new YUITest.TestCase({
    name: "yui-test",

    setUp: function () {
        mockery.registerMock('yui', mockYUI);
        mockery.registerMock('yui/debug', mockYUI);
        mockery.registerMock('express', mockExpress);
        mockery.registerMock('express-state', mockExpressState);
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        ExpressYUI = require('../../lib/yui.js');
    },

    tearDown: function () {
        mockery.deregisterMock('yui');
        mockery.deregisterMock('yui/debug');
        mockery.deregisterMock('express');
        mockery.deregisterMock('express-state');
        mockery.disable();
    },

    "test constructor": function () {
        var obj = new ExpressYUI({});
        A.areEqual('/foo/bar', obj.path, 'wrong path of YUI');
        A.areEqual('1.0', obj.version, 'wrong version of YUI');
    },

    "test config": function () {
        var out,
            obj = new ExpressYUI({});

        out = obj.config({
            root: '/myroot',
            base: '/mybase',
            comboBase: '/mycombobase',
            comboSep: '$'
        });
        A.areEqual('/myroot', out.root, 'wrong root');
        A.areEqual('/mybase', out.base, 'wrong base');
        A.areEqual('/mycombobase', out.comboBase, 'wrong comboBase');
        A.areEqual('$', out.comboSep, 'wrong comboSep');

        // just get
        out = obj.config();
        A.areEqual('/myroot', out.root, 'wrong root, should be preserved');
        A.areEqual('/mybase', out.base, 'wrong base, should be preserved');
        A.areEqual('/mycombobase', out.comboBase, 'wrong comboBase, should be preserved');
        A.areEqual('$', out.comboSep, 'wrong comboSep, should be preserved');

        // customizing values
        out = obj.config({
            root: '/anotherroot'
        });
        A.areEqual('/anotherroot', out.root, 'wrong root, should be overruled');
        A.areEqual('/mybase', out.base, 'wrong base, should not be overruled');
        A.areEqual('/mycombobase', out.comboBase, 'wrong comboBase, should not be overruled');
        A.areEqual('$', out.comboSep, 'wrong comboSep, should not be overruled');
    },

    "test applyConfig": function () {
        var obj = new ExpressYUI({});

        A.areSame(obj, obj.applyConfig({foo: 'bar'}), 'applyConfig should be chainable');

        A.areEqual('bar', obj.config().foo, 'applyConfig should set config.foo');
    },

    "test extend": function () {
        var app = {},
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

    "test setCoreFromCDN": function () {
        var mid,
            obj = new ExpressYUI({}),
            c = {
                baz: 1
            };

        A.isFunction(obj.setCoreFromCDN);

        obj.version = '3.9'; // from yui()
        obj.config = function () {
            return c;
        };

        mid = obj.setCoreFromCDN({
            foo: 'bar'
        });

        OA.areEqual({
            "baz": 1,
            "base": "http://yui.yahooapis.com/3.9/",
            "comboBase": "http://yui.yahooapis.com/combo?",
            "comboSep": "&",
            "root": "3.9/",
            "filter": "debug",
            "combine": false,
            "foo": "bar"
        }, c, 'wrong loader config');

        A.areEqual(obj, mid, 'cdn.setCoreFromCDN() should be chainable');
    }

}));

YUITest.TestRunner.add(suite);

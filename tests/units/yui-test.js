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
    suite,
    Modown,
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

suite = new YUITest.TestSuite("yui-test suite");

suite.add(new YUITest.TestCase({
    name: "yui-test",

    setUp: function () {
        mockery.registerMock('yui', mockYUI);
        mockery.registerMock('express', mockExpress);
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        Modown = require('../../lib/yui.js');
    },

    tearDown: function () {
        mockery.deregisterMock('yui');
        mockery.deregisterMock('express');
        mockery.disable();
    },

    "test constructor": function () {
        var obj = new Modown({});
        A.areEqual('/foo/bar', obj.path, 'wrong path of YUI');
        A.areEqual('1.0', obj.version, 'wrong version of YUI');
    },

    "test config": function () {
        var out,
            obj = new Modown({});

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

    "test debugMode": function () {
        var obj = new Modown({}),
            out;

        A.areSame(obj, obj.debugMode(), 'debugMode should be chainable');
        out = obj.config();
        A.isTrue(out.debug);
        A.areEqual('debug', out.filter);
        A.areEqual('debug', out.logLevel);
        A.isTrue(out.useBrowserConsole);

        obj.debugMode({debug: false, filter: 'raw'});
        out = obj.config();
        A.isFalse(out.debug, 'debug should be overrulled');
        A.areEqual('raw', out.filter, 'filter should be overrulled');
    },

    "test applyConfig": function () {
        var obj = new Modown({});

        A.areSame(obj, obj.applyConfig({foo: 'bar'}), 'applyConfig should be chainable');

        A.areEqual('bar', obj.config().foo, 'applyConfig should set config.foo');
    }

}));

YUITest.TestRunner.add(suite);

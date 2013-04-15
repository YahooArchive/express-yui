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
    pathToYUI = __dirname + '/../../node_modules/yui',
    pathToDefaultYUI = 'yui',
    mockYUI,
    mockDefaultYUI,
    suite,
    modown,
    configFn;

mockYUI = {
    path: function () {
        return "/foo/bar";
    },
    YUI: {
        version: '1.0'
    }
};
mockDefaultYUI = {
    path: function () {
        return "/default/foo/bar";
    },
    YUI: {
        version: '2.0'
    }
};

suite = new YUITest.TestSuite("yui-test suite");

suite.add(new YUITest.TestCase({
    name: "yui-test",

    _should: {
        error: {
            "test config when yui() is not correctly initialized": true,
            "test constructor by calling it twice": true,
            "test constructor with specified YUI that does not exist": true
        },
        ignore: {
            "test debugMode": false
        }
    },

    setUp: function () {

        mockery.registerMock(pathToYUI, mockYUI);
        mockery.registerMock(pathToDefaultYUI, mockDefaultYUI);
        mockery.enable({
            warnOnReplace: false,
            warnOnUnregistered: false
        });

        modown = require('../../lib/yui.js');
        if (modown.locals) {
            delete modown.locals;
        }
    },

    tearDown: function () {
        mockery.deregisterMock(pathToYUI);
        mockery.deregisterMock(pathToDefaultYUI);
        mockery.disable();

        modown = null;
    },

    "test constructor by calling it twice": function () {
        modown({ }, pathToYUI);
        modown({ }, pathToYUI);
    },

    "test constructor using default YUI": function () {
        A.isFunction(modown);

        modown({ });
        A.areEqual('/default/foo/bar', modown.path, 'wrong path for default YUI');
        A.areEqual('2.0', modown.version, 'wrong version for default YUI');
    },

    "test constructor with specified YUI": function () {
        A.isFunction(modown);

        modown({ }, pathToYUI);

        A.isNotUndefined(modown.path, 'no path attached to modown');
        A.isNotUndefined(modown.YUI, 'no YUI attached to modown');
        A.isNotUndefined(modown.version, 'no version attached to modown');

        A.areEqual('1.0', modown.version, 'wrong YUI version');
        A.areEqual('/foo/bar', modown.path, 'wrong YUI version');
    },

    "test constructor with specified YUI that does not exist": function () {
        A.isFunction(modown);
        modown({ }, __dirname + '/../../fake_node_modules/yui');
    },

    "test debugMode": function () {
        A.isFunction(modown.debugMode);

        var fn,
            called;

        fn = modown.config;
        modown.config = function () {
            var args = Array.prototype.slice.call(arguments);

            OA.areEqual({
                debug: true,
                filter: 'debug',
                logLevel: 'debug',
                useBrowserConsole: true
            }, args[0],
                        'wrong default config');
            OA.areEqual({
                debug: false,
                filter: 'raw'
            }, args[1],
                        'wrong provided config');
        };

        modown.debugMode({debug: false, filter: 'raw'});
        modown.config = fn;
    },

    "test applyConfig": function () {
        A.isFunction(modown.applyConfig);

        var fn,
            called;

        fn = modown.config;
        modown.config = function () { called = true; };
        modown.applyConfig({foo: 'bar'});

        A.areEqual(true, called, 'modown.config() was not called');
        modown.config = fn;
    },

    "test config when yui() is not correctly initialized": function () {
        A.isFunction(modown.config);

        modown.config({ root: '/foo' });
    },



    "test config": function () {
        A.isFunction(modown.config);

        var out;

        // need to initialize
        modown({ root: '/newroot' }, pathToYUI);

        out = modown.config({
            root: '/myroot',
            base: '/mybase',
            comboBase: '/mycombobase',
            comboSep: '$'
        });
        // console.log(out);

        A.areEqual('/myroot', out.root, 'wrong root');
        A.areEqual('/mybase', out.base, 'wrong base');
        A.areEqual('/mycombobase', out.comboBase, 'wrong comboBase');
        A.areEqual('$', out.comboSep, 'wrong comboSep');
    },

    "test exposeConfig": function () {
        A.isFunction(modown.exposeConfig);

        var req,
            res,
            fixture,
            configFn,
            out,
            called = false;

        fixture = '(function(){YUI.Env.core.push.apply(YUI.Env.core,["my-module"]);YUI.applyConfig({"root":"/foo/bar","extendedCore":["my-module"]});}())';
        configFn = modown.config;
        modown.config = function () {
            return {
                root: '/foo/bar',
                extendedCore: [ 'my-module' ]
            };
        };
        req = { };
        res = { locals: { yui: { } } };


        out = modown.exposeConfig();
        out(req, res, function () {
            called = true;

            // console.log(res.locals.yui_config);
            A.isNotUndefined(res.locals.yui_config, 'res.locals.yui_config should be defined');
            A.areEqual(fixture,
                       res.locals.yui_config,
                       'unexpected yui_config');
        });

        A.isFunction(out, 'return value should be a middleware');
        A.areEqual(true, called, 'next() was not called');

        modown.config = configFn;
    },

    "test expose": function () {
        A.isFunction(modown.expose);

        var fn1,
            fn2,
            out;

        fn1 = modown.exposeConfig;
        fn2 = modown.exposeSeed;
        modown.exposeConfig = function () { return 'A'; };
        modown.exposeSeed  = function () { return 'B'; };

        out = modown.expose();

        // console.log(out);

        modown.exposeConfig = fn1;
        modown.exposeSeed = fn2;
    }

}));

YUITest.TestRunner.add(suite);

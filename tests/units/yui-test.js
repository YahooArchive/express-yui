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
    modown,
    configFn;

suite = new YUITest.TestSuite("yui-test suite");

suite.add(new YUITest.TestCase({
    name: "yui-test",

    _should: {
        error: {
            "test config when yui() is not correctly initialized": true
        },
        ignore: {
            "test debugMode": false
        }
    },

    setUp: function () {
        modown = require('../../lib/yui.js');
        if (modown.locals) {
            delete modown.locals;
        }
    },

    tearDown: function () {
        modown = null;
    },

    "test constructor by calling it twice": function () {

        var errorThrown = false;

        // first time OK
        modown({ }, __dirname + '/../../node_modules/yui');
        try {
            // second time NOT ok. will throw exception
            modown({ }, __dirname + '/../../node_modules/yui');
        } catch (e) {
            errorThrown = true;
            A.areEqual('Multiple attemps to call `yui()`.Only one `yui` is allow per app.',
                       e.message,
                       'wrong error message');
        }

        A.areEqual(true, errorThrown, 'exception thrown expected');
    },

    "test constructor using default YUI": function () {
        A.isFunction(modown);
    },

    "test constructor with specified YUI": function () {
        A.isFunction(modown);

        modown({ }, __dirname + '/../../node_modules/yui');

        A.isNotUndefined(modown.YUI, 'no YUI attached to modown');
        A.isNotUndefined(modown.version, 'no version attached to modown');
        A.areEqual("/Users/albertoc/fs/stage/ygit/modown/modown-yui/node_modules/yui",
                   modown.path,
                   "wrong path");
    },

    "test constructor with specified YUI that does not exist": function () {
        A.isFunction(modown);

        var errorThrown = false;
        try {
            modown({ }, __dirname + '/../../fake_node_modules/yui');
        } catch (e) {
            errorThrown = true;
        }
        A.areEqual(true, errorThrown, 'exception should be thrown');
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
        modown({
            root: '/newroot'
        }, __dirname + '/../../node_modules/yui');

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

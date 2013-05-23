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
    middleware,
    suite,
    mockStatic,
    origin;

suite = new YUITest.TestSuite("middleware-test suite");

suite.add(new YUITest.TestCase({
    name: "middleware-test",

    _should: {
        error: {
            "test setCoreFromAppOrigin without calling yui()": true
        }
    },

    setUp: function () {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        mockStatic = {};
        mockery.registerMock('modown-static', mockStatic);
        middleware = require('../../lib/middleware.js');
    },

    tearDown: function () {
        mockStatic = null;
        middleware = null;
        mockery.disable();
    },

    "test static": function () {

        var mid,
            options,
            config,
            combineCalled,
            req = {
                app: {
                    yui: {
                        _groupFolderMap: {
                            'testgroup': 'testgroup/bar/baz'
                        },
                        path: 'yui/foo/bar',
                        config: function () { return config; }
                    }
                }
            },
            res = {},
            folders,
            counter = 0;

        options = {
            foo: 1
        };
        config = {
            root: "http://foo.yahoo.com",
            comboBase: "/samba~",
            comboSep: "$",
            local: true,
            combine: true,
            groups: {
                "testgroup": {
                    root: "http://foo.yahoo.com",
                    comboBase: "/samba~",
                    comboSep: "$",
                    local: true
                }
            }
        };

        mockStatic.combine = function (o) {
            combineCalled = true;
            A.areEqual(1, o.foo, 'options should be propagated');
            return function (req, res, next) {
                counter += 1;
                next();
            };
        };

        folders = [function (groupName, groupPath, o) {
            // console.log(o);
            A.areEqual('yui', groupName, 'yui group should be added to static.folder()');
            A.areEqual('yui/foo/bar', groupPath, 'yui path should be collected from app.yui.version');
            A.areEqual(1, o.foo, 'options should be propagated');

            return function (req, res, next) {
                counter += 1;
                next();
            };
        }, function (groupName, groupPath, o) {
            // console.log(o);
            A.areEqual('testgroup', groupName, 'testgroup group should be added to static.folder()');
            A.areEqual('testgroup/bar/baz', groupPath, 'testgroup path should be collected from _groupFolderMap');
            A.areEqual(1, o.foo, 'options should be propagated');

            return function (req, res, next) {
                counter += 1;
                next();
            };
        }];

        mockStatic.folder = function () {
            return folders.shift().apply(this, arguments);
        };

        mid = middleware['static'](options);

        mid(req, res, function (err, data) {
            counter += 1;
        });

        A.areEqual(true, combineCalled, 'static.combine() was not called');
        A.isFunction(mid, 'static() should return a middleware');
        A.areEqual(4, counter, 'not all middleware were called');
    },

    /**
    Test exposeSeed with:
    - custom seed 
    - default filter
    - combine is true core, but not for custom group
    - root '/app/' for combo request
    **/
    "test exposeSeed with combine": function () {
        var mid,
            req = {
                app: {
                    yui: {
                        config: function () {
                            return {
                                seed: ['yui', 'test@app'],
                                // filter: '-raw',
                                base: 'static/',
                                combine: true,
                                root: '/app/',
                                comboBase: 'http://foo.bar/combo?',
                                comboSep: '~',
                                groups: {
                                    app: {
                                        base: '/app-base/',
                                        root: '/app-root/'
                                    }
                                }
                            };
                        },
                        getDefaultSeed: function () {
                            return ['yui'];
                        }
                    }
                }
            },
            res = { locals: { } },
            nextCalled = false;

        mid = middleware.exposeSeed();
        mid(req, res, function () {
            var seed = res.locals.yui_seed;

            nextCalled = true;
            A.isNotUndefined(seed, 'res.locals.yui_seed not set');

            // [ { src: 'http://foo.bar/combo?/app/yui/yui-min.js' },
            //      { src: '/app-base/test/test-min.js' } ]
            // console.log(seed);
            A.areEqual(2, seed.length, 'only 1 seed expected');
            OA.areEqual({ src: 'http://foo.bar/combo?/app/yui/yui-min.js' },
                        seed[0],
                        'seed[0] does not match');
            OA.areEqual({ src: '/app-base/test/test-min.js' },
                        seed[1],
                        'seed[1] does not match');
        });

        A.isFunction(mid, 'middleware should be a function');
        A.areEqual(true, nextCalled, 'next() was not called from the middleware');
    },

    /**
    Test exposeSeed with:
    - default seed
    - filter '-debug'
    - base '/static/' for non combo request
    **/
    "test exposeSeed": function () {
        var mid,
            req = {
                app: {
                    yui: {
                        config: function () {
                            return {
                                // no seed, force getDefaultSeed to be called
                                filter: '-debug',
                                base: '/static/'
                            };
                        },
                        getDefaultSeed: function () {
                            return ['yui'];
                        }
                    }
                }
            },
            res = { locals: { } },
            nextCalled = false;

        mid = middleware.exposeSeed();
        mid(req, res, function () {
            var seed = res.locals.yui_seed;

            nextCalled = true;
            A.isNotUndefined(seed, 'res.locals.yui_seed not set');

            // [ { src: '/static/yui/yui-min.js' } ]
            // console.log(seed);
            A.areEqual(1, seed.length, 'only 1 seed expected');
            OA.areEqual({ src: '/static/yui/yui-min.js' },
                        seed[0],
                        'seed does not match');
        });

        A.isFunction(mid, 'middleware should be a function');
        A.areEqual(true, nextCalled, 'next() was not called from the middleware');
    },

    "test exposeConfig": function () {
        var req,
            res,
            fixture,
            configFn,
            mid,
            called = false;

        fixture = '(function(){YUI.Env.core.push.apply(YUI.Env.core,["my-module"]);YUI.applyConfig({"root":"/foo/bar","extendedCore":["my-module"]});}())';
        req = { app: { yui: { config: function () {
            return {
                root: '/foo/bar',
                extendedCore: [ 'my-module' ]
            };
        } } } };
        res = { locals: { yui: { } } };


        mid = middleware.exposeConfig();
        mid(req, res, function () {
            called = true;

            // console.log(res.locals.yui_config);
            A.isNotUndefined(res.locals.yui_config, 'res.locals.yui_config should be defined');
            A.areEqual(fixture,
                       res.locals.yui_config,
                       'unexpected yui_config');
        });

        A.isFunction(mid, 'return value should be a middleware');
        A.areEqual(true, called, 'next() was not called');
    },

    "test expose": function () {
        var fn1,
            fn2,
            mid;

        fn1 = middleware.exposeConfig;
        fn2 = middleware.exposeSeed;
        middleware.exposeConfig = function () { return 'A'; };
        middleware.exposeSeed  = function () { return 'B'; };

        mid = middleware.expose();

        A.areEqual('A', mid[0], 'exposeConfig was not included in expose');
        A.areEqual('B', mid[1], 'exposeSeed was not included in expose');

        middleware.exposeConfig = fn1;
        middleware.exposeSeed = fn2;
    }

}));

YUITest.TestRunner.add(suite);

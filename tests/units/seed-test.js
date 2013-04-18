/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

var YUITest = require('yuitest'),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    suite,
    seed;

suite = new YUITest.TestSuite("seed-test suite");

suite.add(new YUITest.TestCase({
    name: "seed-test",

    setUp: function () {
        seed = require('../../lib/seed.js');
    },
    tearDown: function () {
        delete seed.config;

        seed = "undefined";
    },

    "test getDefaultSeed": function () {
        A.isFunction(seed.getDefaultSeed);

        var out;
        out = seed.getDefaultSeed();

        A.areEqual(1, out.length, 'wrong number of seed');
        A.areEqual('yui', out[0], 'wrong default seed');
    },

    "test addModuleToSeed": function () {
        A.isFunction(seed.addModuleToSeed);

        var yui_config,
            mid;

        yui_config = { };
        seed.config = function () {
            return yui_config;
        };

        mid = seed.addModuleToSeed('newModuleName', 'newGroupName');

        A.areEqual(false, mid, 'seed.addModuleToSeed() should return false');
        A.areEqual(1, yui_config.extendedCore.length, 'wrong extendedCore length');
        A.areEqual('newModuleName',
                   yui_config.extendedCore[0],
                   'wrong extendedCore module');

        // delete seed.config;
    },

    "test seed": function () {
        A.isFunction(seed.seed);

        var mid,
            yui_config;


        yui_config = {
            seed: ['yui', 'foo@app', 'bar@app']
        };
        seed.config = function () {
            return yui_config;
        };

        mid = seed.seed(['baz@app']);

        A.areEqual(false, mid, 'seed.seed() should return false');
        A.areEqual(1, yui_config.seed.length, 'yui_config should have 1 seed only');

    },

    "test exposeSeed with no seed": function () {
        A.isFunction(seed.exposeSeed);

        var middleware;

        seed.config = function () {
            return {
                seed: []
            };
        };

        middleware = seed.exposeSeed();

        A.areEqual(false, middleware, 'exposeSeed() should return false when no default seed is configured');

    },

    /**
    Test exposeSeed with:
    - custom seed 
    - default filter
    - combine is true core, but not for custom group
    - root '/app/' for combo request
    **/
    "test exposeSeed with combine": function () {
        A.isFunction(seed.exposeSeed);

        var middleware,
            req = {},
            res = { locals: { } },
            nextCalled = false;

        seed.config = function () {
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
        };

        middleware = seed.exposeSeed();
        middleware(req, res, function () {
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

        A.isFunction(middleware, 'middleware should be a function');
        A.areEqual(true, nextCalled, 'next() was not called from the middleware');
    },

    /**
    Test exposeSeed with:
    - default seed
    - filter '-debug'
    - base '/static/' for non combo request
    **/
    "test exposeSeed": function () {
        A.isFunction(seed.exposeSeed);

        var middleware,
            req = {},
            res = { locals: { } },
            nextCalled = false;

        seed.config = function () {
            return {
                // no seed, force getDefaultSeed to be called
                filter: '-debug',
                base: '/static/'
            };
        };

        middleware = seed.exposeSeed();
        middleware(req, res, function () {
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

        A.isFunction(middleware, 'middleware should be a function');
        A.areEqual(true, nextCalled, 'next() was not called from the middleware');
    }
}));

YUITest.TestRunner.add(suite);

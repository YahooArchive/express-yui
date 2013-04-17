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
    mockStatic,
    origin;

suite = new YUITest.TestSuite("origin-test suite");


suite.add(new YUITest.TestCase({
    name: "origin-test",

    _should: {
        error: {
            "test serveCoreFromAppOrigin without calling yui()": true
        }
    },

    setUp: function () {
        mockery.enable({
            useCleanCache: true,
            warnOnReplace: false,
            warnOnUnregistered: false
        });
        mockStatic = { }; // each test case will customize this
    },
    tearDown: function () {
        mockStatic = null;
        mockery.disable();

        // cleanup
        delete origin.config;
        delete origin._map;
        origin = null;
    },

    "test serveCoreFromAppOrigin": function () {
        origin = require('../../lib/origin');
        A.isFunction(origin.serveCoreFromAppOrigin);
    },

    // modown-yui need to be initialized with `yui({}, pathToYUI);`
    // show throw Error
    "test serveCoreFromAppOrigin without calling yui()": function () {
        origin = require('../../lib/origin');

        origin.serveCoreFromAppOrigin({});
    },

    "test serveCoreFromAppOrigin with yui() init": function () {

        var mid,
            configCalled = false,
            folderCalled = false;

        mockStatic = {
            folder: function (groupName, folderPath, options) {
                folderCalled = true;

                A.areEqual('yui', groupName, 'groupName should be `yui`');
                A.areEqual('/path/to/fakeYUI', folderPath, 'wrong folderPath');
                OA.areEqual({ maxAge: 0 }, options, 'options does not match');

                return function (req, res, next) {
                };
            }
        };
        mockery.registerMock('modown-static', mockStatic);
        origin = require('../../lib/origin');


        origin.path = "/path/to/fakeYUI";
        origin.config = function () {
            configCalled = true;

            // TODO: verify loaderConfig merging with DEFAULT_COMBO_CONFIG
            var args = Array.prototype.slice.call(arguments);

            A.areEqual(2, args.length, 'only 2 args expected when calling this.config()');
            A.areEqual('bar', args[1].foo, 'foo = bar');
        };

        mid = origin.serveCoreFromAppOrigin({ foo: 'bar' }, {});

        A.areEqual(true, configCalled, 'yui.config() was not called');
        A.areEqual(true, folderCalled, 'middleware.folder() was not called');
        A.isFunction(mid, 'origin.serveCoreFromAppOrigin() should return middleware');

        mockery.deregisterMock('modown-static');
    },

    "test serveGroupFromAppOrigin": function () {
        origin = require('../../lib/origin');
        A.isFunction(origin.serveGroupFromAppOrigin);
    },

    // registerGroup() was not called prior to serveGroupFromAppOrigin()
    "test serveGroupFromAppOrigin with group not registered": function () {
        origin = require('../../lib/origin');

        var mid;
        origin.config = function () { };
        mid = origin.serveGroupFromAppOrigin('app', {}, {});

        A.areEqual(false, mid, 'serveGroupFromAppOrigin() should return false');
    },

    // group 'app' has been registered OK using yui.registerGroup()
    "test serveGroupFromAppOrigin with valid group": function () {
        var mid,
            folderCalled = false;

        mockStatic = {
            folder: function (groupName, folderPath, options) {
                folderCalled = true;
                A.areEqual('app', groupName, 'wrong groupName');
                A.areEqual('/build', folderPath, 'wrong folderPath');
                // console.log(options);
                OA.areEqual({ prefix: '/static', foo: 'bar', maxAge: 0 },
                            options,
                            'wrong options');
            }
        };
        mockery.registerMock('modown-static', mockStatic);
        origin = require('../../lib/origin');

        // mocks for registerGroup
        origin.addModuleToSeed = function () { };
        origin.getGroupConfig = function (metaFile) {
            // console.log('metaFile: ' + metaFile);
            return {
                moduleName: 'testModule',
                groupName: 'app',
                modules: [ ]
            };
        };
        // mock yui.config
        origin.config = function () {
            // console.log('=======> config');
            return {
                groups: { app: { } }
            };
        };
        // set origin._groupFolderMap:
        // { app: '/build' }
        // console.log(origin._groupFolderMap);
        mid = origin.registerGroup('app', '/build');
        mid = origin.serveGroupFromAppOrigin('app',
                                             // loader options
                                             {},
                                             // modown-static options
                                             { prefix: '/static', foo: 'bar' });

        A.areEqual(true, folderCalled, 'middleware.folder() was not called');

        mockery.deregisterMock('modown-static');
    },

    "test registerGroup with invalid / missing group config": function () {
        origin = require('../../lib/origin');
        A.isFunction(origin.registerGroup);

        var mid;

        origin.getGroupConfig = function () {
            return;
        };
        mid = origin.registerGroup('foo', '/build');

        A.areEqual(false, mid, 'origin.registerGroup() should return false');
    },

    "test registerGroup with groupName mismatch": function () {
        origin = require('../../lib/origin');
        A.isFunction(origin.registerGroup);

        var mid;

        origin.getGroupConfig = function () {
            return {
                groupName: 'bar' // does not match 'foo'
            };
        };
        mid = origin.registerGroup('foo', '/build');

        A.areEqual(false, mid, 'origin.registerGroup() should return false');

        delete origin._groupFolderMap;
        delete origin.getGroupConfig;
    },

    "test registerGroup": function () {
        origin = require('../../lib/origin');
        A.isFunction(origin.registerGroup);

        var getGroupConfigCalled = false,
            addModuleToSeedCalled = false,
            mid,
            config;

        // config returned by yui.config()
        config = {
        };
        origin.getGroupConfig = function (metaFile) {
            A.areEqual('/origin/build/testgroup/testgroup.js',
                       metaFile,
                       'wrong metaFile');
            getGroupConfigCalled = true;
            return {
                // fake group
                moduleName: 'testModuleName',
                moduleVersion: '',
                moduleConfig: { },
                groupName: 'testgroup',
                modules: { }
            };
        };
        origin.config = function () {
            return config;
        };
        origin.addModuleToSeed = function (moduleName, groupName) {
            A.areEqual('testModuleName', moduleName, 'wrong moduleName');
            A.areEqual('testgroup', groupName, 'wrong groupName');
            addModuleToSeedCalled = true;
        };

        mid = origin.registerGroup('testgroup', '/origin/build');

        A.areEqual(false, mid, 'origin.registerGroup() should return false');
        A.areEqual('/origin/build',
                   origin._groupFolderMap.testgroup,
                   'wrong groupRoot');
        A.areEqual(true, getGroupConfigCalled, 'getGroupConfig was not called');
        A.areEqual(true, addModuleToSeedCalled, 'addModuleToSeed was not called');

        delete origin.config;
        delete origin.getGroupConfig;
        delete origin.addModuleToSeed;
    },

    "test serveCombinedFromAppOrigin": function () {

        var mid,
            options,
            config,
            combineCalled = false;

        options = {
            maxURLLength: 1024,
            comboBase: "/samba~",
            comboSep: "$"
        };
        config = {
            root: "http://foo.yahoo.com",
            comboBase: "/samba~",
            comboSep: "$",
            groups: {
                "testgroup": {
                    root: "http://foo.yahoo.com",
                    comboBase: "/samba~",
                    comboSep: "$"
                }
            }
        };

        mockStatic = {
            combine: function (o) {
                // console.log(o); console.log(options);
                combineCalled = true;
                // OA.areEqual(options, o, 'unexpected options');
                A.areEqual(options.base, o.base, 'wrong config.base');
                A.areEqual(options.comboBase, o.comboBase, 'wrong config.comboBase');
                A.areEqual(options.comboSep, o.comboSep, 'wrong config.comboSep');
                A.areEqual(1024, options.maxURLLength, 'wrong options.maxURLLength');
                

                return function (req, res, next) {
                };
            }
        };
        mockery.registerMock('modown-static', mockStatic);

        origin = require('../../lib/origin');
        A.isFunction(origin.serveCombinedFromAppOrigin);
        origin.config = function () {
            return config;
        };
        origin._map = { };

        mid = origin.serveCombinedFromAppOrigin(options);

        A.areEqual(true, combineCalled, 'middleware.combine() was not called');
        A.areEqual(true, config.combine, 'config.combine should be true');
        A.isFunction(mid, 'origin.serveCombinedFromAppOrigin() should return function');
        A.areEqual(true,
                   config.groups.testgroup.combine,
                   'combine should be true since the group share same base as options');

        mockery.deregisterMock('modown-static');
    }
}));

YUITest.TestRunner.add(suite);

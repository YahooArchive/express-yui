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
    origin = require('../../lib/origin');

suite = new YUITest.TestSuite("origin-test suite");

suite.add(new YUITest.TestCase({
    name: "origin-test",

    _should: {
        error: {
            "test registerGroup with invalid / missing group config": true,
            "test registerGroup with groupName mismatch": true
        }
    },

    setUp: function () {
        origin._app = {
            _mockAttrs: {},
            // express app
            set: function (name, value) {
                this._mockAttrs[name] = value;
            },
            get: function (name) {
                return this._mockAttrs[name];
            }
        };
        origin._clientModules = {};
    },
    tearDown: function () {
        // cleanup
        delete origin.config;
        delete origin._groupFolderMap;
        delete origin.addModuleToSeed;
        delete origin._app;
        delete origin.version;
        delete origin._clientModules;
    },

    "test setCoreFromAppOrigin": function () {
        A.isFunction(origin.setCoreFromAppOrigin);
    },

    "test setCoreFromAppOrigin result": function () {

        var mid,
            c = {
                bar: 2
            };
        // setting up the basic config
        origin._app.set('yui default base', '/static/');
        origin._app.set('yui default root', '/static/');
        origin._app.set('yui combo config', {
            "maxURLLength": 1024,
            "comboBase": "/static/combo?",
            "comboSep": "&"
        });
        origin.version = 'a.b.c';
        origin.config = function () {
            return c;
        };
        mid = origin.setCoreFromAppOrigin({ foo: 'bar' });
        OA.areEqual({
            "bar": 2,
            "maxURLLength": 1024,
            "comboBase": "/static/combo?",
            "comboSep": "&",
            "base": "/static/yui-a.b.c/",
            "root": "/static/yui-a.b.c/",
            "foo": "bar"
        }, c, 'wrong loader config');
        A.areSame(origin, mid, 'origin.setCoreFromAppOrigin() should be chainable');
    },

    "test applyGroupConfig": function () {
        A.isFunction(origin.applyGroupConfig);
        var mid,
            c = {
                foo: 1
            };

        origin.config = function () { return c; };

        // first group
        mid = origin.applyGroupConfig('app', {bar: 2});
        A.areEqual(JSON.stringify({
            "foo": 1,
            "groups": {
                "app": {
                    "bar": 2
                }
            }
        }), JSON.stringify(c), 'first groups should be supported by honoring old data');
        A.areSame(origin, mid, 'origin.applyGroupConfig() should be chainable');

        // second group
        mid = origin.applyGroupConfig('second', {baz: 3});
        A.areEqual(JSON.stringify({
            "foo": 1,
            "groups": {
                "app": {
                    "bar": 2
                },
                "second": {
                    "baz": 3
                }
            }
        }), JSON.stringify(c), 'second groups should be supported by honoring old data');
        A.areSame(origin, mid, 'origin.applyGroupConfig() should be chainable');

        // modifying group
        mid = origin.applyGroupConfig('second', {baz: 4, xyz: 5});
        A.areEqual(JSON.stringify({
            "foo": 1,
            "groups": {
                "app": {
                    "bar": 2
                },
                "second": {
                    "baz": 4,
                    "xyz": 5
                }
            }
        }), JSON.stringify(c), 'reconfiguruing groups should be supported by honoring old data');
        A.areSame(origin, mid, 'origin.applyGroupConfig() should be chainable');
    },

    "test registerGroup with invalid / missing group config": function () {
        A.isFunction(origin.registerGroup);
        origin.registerGroup('foo', '/build');
        // this test is expected to throw
    },

    "test registerGroup with groupName mismatch": function () {
        A.isFunction(origin.registerGroup);
        origin.registerGroup('foo', '/build');
        // this test is expected to throw
    },

    "test registerGroup with no previous settings for group": function () {
        A.isFunction(origin.registerGroup);

        var addModuleToSeedCalled = false,
            mid,
            config;

        // config returned by yui.config()
        config = {
        };
        origin.config = function () {
            return config;
        };
        origin.addModuleToSeed = function (moduleName) {
            A.areEqual('loader-testgroup', moduleName, 'wrong moduleName');
            addModuleToSeedCalled = true;
        };

        mid = origin.registerGroup('testgroup', '/origin/testgroup-a.b.c');

        A.isObject(config.groups.testgroup, 'group config added');
        A.areEqual(true, addModuleToSeedCalled, 'addModuleToSeed was not called');

        A.areSame(origin, mid, 'origin.registerGroup() should be chainable');

        // testing the configuration of the new group
        A.areEqual(JSON.stringify({
            "groups": {
                "testgroup": {
                    "base": "/testgroup-a.b.c/",
                    "root": "/testgroup-a.b.c/",
                    "combine": true,
                    "filter": "min"
                }
            }
        }), JSON.stringify(config), 'wrong loader configuration for new group');
    },

    "test registerGroup with previous settings for group": function () {
        A.isFunction(origin.registerGroup);

        var addModuleToSeedCalled = false,
            mid,
            config;

        // config returned by yui.config()
        config = {
            bar: 2,
            groups: {
                app: {
                    foo: 1,
                    base: "/path/to/app/",
                    root: "folder/app/"
                }
            }
        };
        origin.config = function () {
            return config;
        };
        origin.addModuleToSeed = function (moduleName) {
            A.areEqual('loader-app', moduleName, 'wrong moduleName');
        };

        mid = origin.registerGroup('app', 'path/to/app-x.y.z');

        A.isObject(config.groups.app, 'wrong group config');

        // testing the configuration of the new group
        A.areEqual(JSON.stringify({
            "bar": 2,
            "groups": {
                "app": {
                    "base": "/path/to/app/", // base and root should be preserved
                    "root": "folder/app/",
                    "combine": true,
                    "filter": "min",
                    "foo": 1
                }
            }
        }), JSON.stringify(config), 'wrong loader configuration for new group');
    },

    "test registerGroup with custom default yui settings": function () {
        var mid,
            config;

        // config returned by yui.config()
        config = {};
        origin.config = function () {
            return config;
        };
        origin.addModuleToSeed = function (moduleName) {};
        origin._app.set('yui default base', "http://custom/base/with/token/");
        origin._app.set('yui default root', 'custom/root/withou/token');
        mid = origin.registerGroup('app', 'path/to/app-x.y.z');

        // testing the configuration of the new group
        A.areEqual(JSON.stringify({
            "groups": {
                "app": {
                    "base": "http://custom/base/with/token/app-x.y.z/",
                    "root": "custom/root/withou/token/app-x.y.z/",
                    "combine": true,
                    "filter": "min"
                }
            }
        }), JSON.stringify(config), 'wrong loader configuration for new group');
    }
}));

YUITest.TestRunner.add(suite);

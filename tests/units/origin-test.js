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
            // express app
            set: function () {}
        };
    },
    tearDown: function () {
        // cleanup
        delete origin.config;
        delete origin._groupFolderMap;
        delete origin.addModuleToSeed;
        delete origin.getGroupConfig;
        delete origin._app;
        delete origin.version;
    },

    "test setCoreFromAppOrigin": function () {
        A.isFunction(origin.setCoreFromAppOrigin);
    },

    "test setCoreFromAppOrigin result": function () {

        var mid,
            c = {
                bar: 2
            };

        origin.version = 'a.b.c';
        origin.config = function () {
            return c;
        };
        mid = origin.setCoreFromAppOrigin({ foo: 'bar' });

        OA.areEqual({
            "bar": 2,
            "maxURLLength": 1024,
            "comboBase": "/combo~",
            "comboSep": "~",
            "foo": "bar",
            "base": "/yui-a.b.c/",
            "root": "/yui-a.b.c/",
            "local": true
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

        origin.getGroupConfig = function () {
            return;
        };
        origin.registerGroup('foo', '/build');
    },

    "test registerGroup with groupName mismatch": function () {
        A.isFunction(origin.registerGroup);

        origin.getGroupConfig = function () {
            return {
                groupName: 'bar' // does not match 'foo'
            };
        };
        origin.registerGroup('foo', '/build');
    },

    "test registerGroup with no previous settings for group": function () {
        A.isFunction(origin.registerGroup);

        var getGroupConfigCalled = false,
            addModuleToSeedCalled = false,
            mid,
            config;

        // config returned by yui.config()
        config = {
        };
        origin.getGroupConfig = function (metaFile) {
            A.areEqual('/origin/testgroup-a.b.c/testgroup/testgroup.js', metaFile, 'wrong metaFile');
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

        mid = origin.registerGroup('testgroup', '/origin/testgroup-a.b.c');

        A.areEqual('/origin/testgroup-a.b.c',
                   origin._groupFolderMap.testgroup,
                   'wrong groupRoot');
        A.areEqual(true, getGroupConfigCalled, 'getGroupConfig was not called');
        A.areEqual(true, addModuleToSeedCalled, 'addModuleToSeed was not called');

        A.areSame(origin, mid, 'origin.registerGroup() should be chainable');

        // testing the configuration of the new group
        A.areEqual(JSON.stringify({
            "groups": {
                "testgroup": {
                    "base": "/testgroup-a.b.c/",
                    "root": "/testgroup-a.b.c/",
                    "local": true,
                    "combine": true,
                    "filter": "min",
                    "maxURLLength": 1024,
                    "comboBase": "/combo~",
                    "comboSep": "~"
                }
            }
        }), JSON.stringify(config), 'wrong loader configuration for new group');
    },

    "test registerGroup with previous settings for group": function () {
        A.isFunction(origin.registerGroup);

        var getGroupConfigCalled = false,
            addModuleToSeedCalled = false,
            mid,
            config;

        // config returned by yui.config()
        config = {
            bar: 2,
            groups: {
                app: {
                    foo: 1,
                    base: "/path/to/{{groupDir}}/",
                    root: "folder/{{groupDir}}/"
                }
            }
        };
        origin.getGroupConfig = function (metaFile) {
            return {
                // fake group
                moduleName: 'app-meta',
                moduleVersion: '',
                moduleConfig: { },
                groupName: 'app',
                modules: { }
            };
        };
        origin.config = function () {
            return config;
        };
        origin.addModuleToSeed = function (moduleName, groupName) {
            A.areEqual('app-meta', moduleName, 'wrong moduleName');
            A.areEqual('app', groupName, 'wrong groupName');
        };

        mid = origin.registerGroup('app', 'path/to/app-x.y.z');

        A.areEqual('path/to/app-x.y.z',
                   origin._groupFolderMap.app,
                   'wrong groupRoot');

        // testing the configuration of the new group
        A.areEqual(JSON.stringify({
            "bar": 2,
            "groups": {
                "app": {
                    "base": "/path/to/app-x.y.z/",
                    "root": "folder/app-x.y.z/",
                    "local": true,
                    "combine": true,
                    "filter": "min",
                    "maxURLLength": 1024,
                    "comboBase": "/combo~",
                    "comboSep": "~",
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
        origin.getGroupConfig = function (metaFile) {
            return {
                // fake group
                moduleName: 'app-meta',
                moduleVersion: '',
                moduleConfig: { },
                groupName: 'app',
                modules: { }
            };
        };
        origin.config = function () {
            return config;
        };
        origin.addModuleToSeed = function (moduleName, groupName) {};
        origin._app = {
            // express app
            set: function (name) {
                return {
                    'yui default base': "http://custom/base/with/token/{{groupDir}}/string",
                    'yui default root': 'custom/root/withou/token'
                }[name];
            }
        };
        mid = origin.registerGroup('app', 'path/to/app-x.y.z');

        // testing the configuration of the new group
        A.areEqual(JSON.stringify({
            "groups": {
                "app": {
                    "base": "http://custom/base/with/token/app-x.y.z/string",
                    "root": "custom/root/withou/token",
                    "local": false,
                    "combine": true,
                    "filter": "min",
                    "maxURLLength": 1024,
                    "comboBase": "/combo~",
                    "comboSep": "~"
                }
            }
        }), JSON.stringify(config), 'wrong loader configuration for new group');
    }

}));

YUITest.TestRunner.add(suite);

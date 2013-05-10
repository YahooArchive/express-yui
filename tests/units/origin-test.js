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
            "test setGroupFromAppOrigin with group not registered": true,
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
    },

    "test setCoreFromAppOrigin": function () {
        A.isFunction(origin.setCoreFromAppOrigin);
    },

    "test setCoreFromAppOrigin result": function () {

        var mid,
            c = {
                bar: 2
            };

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
            "base": "/yui/",
            "root": "/yui/",
            "local": true
        }, c, 'wrong loader config');
        A.areSame(origin, mid, 'origin.setCoreFromAppOrigin() should be chainable');
    },

    "test setGroupFromAppOrigin": function () {
        A.isFunction(origin.setGroupFromAppOrigin);
    },

    // registerGroup() was not called prior to setGroupFromAppOrigin()
    "test setGroupFromAppOrigin with group not registered": function () {
        origin.config = function () { };
        // this should throw
        origin.setGroupFromAppOrigin('app', {});
    },

    // group 'app' has been registered OK using yui.registerGroup()
    "test setGroupFromAppOrigin with valid group": function () {
        var mid,
            c = {
                bar: 3
            };

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
            return c;
        };
        // set origin._groupFolderMap:
        // { app: '/build' }
        // console.log(origin._groupFolderMap);
        mid = origin.registerGroup('app', '/build');
        mid = origin.setGroupFromAppOrigin('app', {});

        A.areEqual(JSON.stringify({
            "bar": 3,
            "groups": {
                "app": {
                    "maxURLLength": 1024,
                    "comboBase": "/combo~",
                    "comboSep": "~",
                    "base": "/app/",
                    "root": "/app/",
                    "local": true
                }
            }
        }), JSON.stringify(c), 'wrong loader configuration');
        A.areSame(origin, mid, 'origin.setGroupFromAppOrigin() should be chainable');
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

    "test registerGroup": function () {
        A.isFunction(origin.registerGroup);

        var getGroupConfigCalled = false,
            addModuleToSeedCalled = false,
            mid,
            config;

        // config returned by yui.config()
        config = {
        };
        origin.getGroupConfig = function (metaFile) {
            A.areEqual('/origin/build/testgroup/testgroup.js', metaFile, 'wrong metaFile');
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

        A.areEqual('/origin/build',
                   origin._groupFolderMap.testgroup,
                   'wrong groupRoot');
        A.areEqual(true, getGroupConfigCalled, 'getGroupConfig was not called');
        A.areEqual(true, addModuleToSeedCalled, 'addModuleToSeed was not called');

        A.areSame(origin, mid, 'origin.registerGroup() should be chainable');
    },

    "test combineGroups": function () {

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
                },
                "cdngroup": {}
            }
        };

        A.isFunction(origin.combineGroups);
        origin.config = function () {
            return config;
        };

        mid = origin.combineGroups(options);

        A.areEqual(true, config.combine, 'config.combine should be true');
        A.areEqual(true, config.groups.testgroup.combine,
                   'combine should be true since the group share same base as options');

        A.areEqual(JSON.stringify({
            "root": "http://foo.yahoo.com",
            "comboBase": "/samba~",
            "comboSep": "$",
            "groups": {
                "testgroup": {
                    "root": "http://foo.yahoo.com",
                    "comboBase": "/samba~",
                    "comboSep": "$",
                    "combine": true
                },
                "cdngroup": {}
            },
            "combine": true
        }), JSON.stringify(config), 'wrong loader config');

        A.areSame(origin, mid, 'origin.combineGroups() should be chainable');
    }
}));

YUITest.TestRunner.add(suite);

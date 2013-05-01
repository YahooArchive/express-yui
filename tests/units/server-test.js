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
    server = require('../../lib/server.js'),
    original = server.getYInstance;

suite = new YUITest.TestSuite("modown-yui server suite");

suite.add(new YUITest.TestCase({
    name: "server-test",

    setUp: function () {
        server.getYInstance = original;
    },

    tearDown: function () {
        // unregister mocks
        delete server.config;
        delete server.YUI;
        delete server._Y;
        delete server.version;
    },

    "test constructor": function () {
        A.isNotNull(server, "server require failed");
    },

    "test attachModules": function () {
        // attaching for the first time
        server.attachModules('foo', {
            'baz': {},
            'bar': {}
        });
        // flagging Env
        server._Y = {
            Env: {
                _attached: {
                    baz: true
                },
                _used: {},
                _loader: {
                    loaded: {},
                    inserted: {},
                    required: {}
                }
            }
        };
        server.YUI = {
            Env: {
                _loaded: {
                    '1': {
                        baz: true
                    }
                },
                mods: {}
            }
        };
        server.version = '1';
        // attaching again
        server.attachModules('foo', {
            'baz': {},
            'bar': {}
        });
        A.isUndefined(server._Y.Env._attached.baz, 'Y.Env was not correctly cleaned up');
        A.isUndefined(server.YUI.Env._loaded['1'].baz, 'YUI.Env was not correctly cleaned up');
    },

    "test use": function () {
        var clonerTest = {},
            Y = YUITest.Mock(),
            result;

        YUITest.Mock.expect(server, {
            method: 'config',
            args: [],
            callCount: 3,
            run: function () {
                return {
                    groups: {
                        'foo': {
                            more: 1
                        }
                    },
                    ref: clonerTest
                };
            }
        });
        YUITest.Mock.expect(Y, {
            method: 'applyConfig',
            args: [YUITest.Mock.Value.Object],
            callCount: 1,
            run: function (groupConfig) {
                A.areSame(1, groupConfig.groups.foo.more, 'group config from original should be mix with groupConfig');
            }
        });
        YUITest.Mock.expect(Y, {
            method: 'use',
            args: [YUITest.Mock.Value.Any],
            callCount: 2,
            run: function (modules) {
                A.isArray(modules);
                A.areSame('baz', modules[0]);
                A.areSame('bar', modules[1]);
            }
        });
        Y.Env = {};
        YUITest.Mock.expect(server, {
            method: 'YUI',
            callCount: 1,
            args: [YUITest.Mock.Value.Object, YUITest.Mock.Value.Object, YUITest.Mock.Value.Object],
            run: function (originalConfig, defaultConfig, groupConfig) {
                A.areNotEqual(clonerTest, originalConfig.ref, 'original config should be cloned');
                A.areSame(1, groupConfig.groups.foo.more, 'group config from original should be mix with groupConfig');
                return Y;
            }
        });

        // first pass
        // setting up groups
        server.attachModules('foo', {
            'baz': {},
            'bar': {}
        });
        // other mocks
        server._groupFolderMap = {
            'foo': __dirname
        };
        result = server.use();
        A.areSame(Y, result);
        A.areSame(Y, server._Y, 'private _Y used by other internal methods was not exposed');

        // second pass: without any change in groups
        result = server.use();
        A.areSame(Y, result);

        // third pass: with change in groups
        // more groups
        server.attachModules('foo', {
            'baz': {},
            'bar': {}
        });

        result = server.use();
        A.areSame(Y, result);

        YUITest.Mock.verify(server);
        YUITest.Mock.verify(Y);
    }

}));

YUITest.TestRunner.add(suite);

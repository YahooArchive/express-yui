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
    server = require('../../lib/server.js');

suite = new YUITest.TestSuite("modown-yui server suite");

suite.add(new YUITest.TestCase({
    name: "server-test",

    "test constructor": function () {
        A.isNotNull(server, "server require failed");
    },

    "test getYInstance": function () {
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
        result = server.getYInstance();
        A.areSame(Y, result);

        // second pass: without any change in groups
        result = server.getYInstance();
        A.areSame(Y, result);

        // third pass: with change in groups
        // more groups
        server.attachModules('foo', {
            'baz': {},
            'bar': {}
        });
        result = server.getYInstance();
        A.areSame(Y, result);

        YUITest.Mock.verify(server);
        YUITest.Mock.verify(Y);
    },

    "test attachModules": function () {
        A.isUndefined(server.attachModules('foo', {
            'baz': {},
            'bar': {}
        }));
    }

}));

YUITest.TestRunner.add(suite);

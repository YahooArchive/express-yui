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
    loader = require('../../lib/loader.js');

suite = new YUITest.TestSuite("loader-test suite");

suite.add(new YUITest.TestCase({
    name: "loader-test",

    setUp: function () {
        // nothing
    },

    tearDown: function () {
        // unregister mocks
        delete loader._bundles;
        delete loader.attachModules;
        delete loader.registerGroup;
        delete loader.shiftFiles;
        delete loader._checkYUIModule;
        delete loader._checkBuildFile;
        delete loader.BuilderClass;
    },

    "test constructor": function () {
        A.isNotNull(loader, "loader require failed");
    },

    "test plugin constructor": function () {
        var plugin = loader.plugin();
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.isFunction(plugin.bundleUpdated, "missing bundleUpdated member on plugin instance");
        A.isArray(plugin.describe.args, "default shifter options should be honored");
    },

    "test plugin constructor with custom settings": function () {
        var plugin = loader.plugin({
            summary: 1,
            types: 2,
            args: ['4'],
            more: 3
        });
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.areSame(1, plugin.describe.summary);
        A.areSame(2, plugin.describe.types);
        A.areSame(3, plugin.describe.more);
        A.areSame('4', plugin.describe.args[0]);
    },

    "test register": function () {
        loader.register('foo', __dirname, 1);
        loader.register('bar', __filename, 2);
        loader.register('foo', __dirname, 3);
        A.areSame(3, loader._bundles.foo[__dirname]);
        A.areSame(2, loader._bundles.bar[__filename]);
    },

    "test plugin without any modules registered": function () {
        var plugin = loader.plugin(),
            api = YUITest.Mock();

        YUITest.Mock.expect(api, {
            method: 'getBundleFiles',
            args: ['foo', YUITest.Mock.Value.Object],
            run: function (bundleName, filters) {
                return [];
            }
        });
        plugin.bundleUpdated({
            bundle: {
                name: 'foo'
            }
        }, api);
        YUITest.Mock.verify(api);
    },

    "test plugin with filter": function () {
        var filterObj = YUITest.Mock();
        YUITest.Mock.expect(filterObj, {
            method: 'filter',
            callCount: 3,
            args: [YUITest.Mock.Value.Object, YUITest.Mock.Value.String],
            run: function (bundle, relativePath) {
                A.areSame('foo', bundle.name, 'bundle object should be provided');
                return false; // denying all files
            }
        });
        var plugin = loader.plugin({
            filter: filterObj.filter
        });
        var api = YUITest.Mock();

        YUITest.Mock.expect(api, {
            method: 'getBundleFiles',
            args: ['foo', YUITest.Mock.Value.Object],
            run: function (bundleName, filters) {
                return [];
            }
        });
        A.isUndefined(plugin.bundleUpdated({
            bundle: {
                name: 'foo'
            },
            files: {
                'bar.js': { fullPath: __dirname + '/bar.js', relativePath: 'bar.js' },
                'baz.js': { fullPath: __dirname + '/baz.js', relativePath: 'baz.js' },
                'path/to/something.js': { fullPath: __dirname + '/path/to/something.js', relativePath: 'path/to/something.js' }
            }
        }, api), 'all files should be filtered out');
        YUITest.Mock.verify(filterObj);
        YUITest.Mock.verify(api);
    },

    "test plugin flow with register and attach": function () {
        var plugin = loader.plugin({
                registerGroup: true,
                registerServerModules: true,
                useServerModules: true
            }),
            api = YUITest.Mock(),
            bundle = {
                name: 'foo',
                buildDirectory: '/path/to'
            };

        YUITest.Mock.expect(api, {
            method: 'writeFileInBundle',
            args: ['foo', 'loader-foo.js', YUITest.Mock.Value.String],
            run: function (bundleName, destination_path, contents) {
                A.areSame('content of loader-foo.js', contents);
                return {
                    // mocking promise
                    then: function (fn) {
                        return fn(__filename);
                    }
                };
            }
        });
        YUITest.Mock.expect(api, {
            method: 'getBundleFiles',
            args: ['foo', YUITest.Mock.Value.Object],
            run: function (bundleName, filters) {
                return ['bar.js', 'baz.js', 'path/to/build.json'];
            }
        });
        YUITest.Mock.expect(api, {
            method: 'promise',
            args: [YUITest.Mock.Value.Function],
            run: function (fn) {
                return fn(function () {
                    A.isString(bundle.yuiBuildDirectory);
                }, function () {
                    A.fail('promise rejected');
                });
            }
        });
        YUITest.Mock.expect(loader, {
            method: '_checkYUIModule',
            callCount: 3,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return '_checkYUIModule result';
            }
        });
        YUITest.Mock.expect(loader, {
            method: '_checkBuildFile',
            callCount: 1,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return '_checkBuildFile result';
            }
        });
        YUITest.Mock.expect(loader, {
            method: 'registerGroup',
            args: ['foo', '/path/to/yui-build', __filename]
        });
        YUITest.Mock.expect(loader, {
            method: 'registerModules',
            args: ['foo', YUITest.Mock.Value.Object],
            run: function (name, modules) {
                A.areEqual('json version of loader-foo.js', modules.mod1, 'mod1 was not registered');
            }
        });
        YUITest.Mock.expect(loader, {
            method: 'attachModules',
            args: ['foo', YUITest.Mock.Value.Any],
            run: function (name, modules) {
                A.areEqual(1, modules.length, 'mod1 was not attached');
                A.areEqual('mod1', modules[0], 'mod1 was not attached');
            }
        });
        YUITest.Mock.expect(loader, {
            method: 'shiftFiles',
            args: [YUITest.Mock.Value.Any, YUITest.Mock.Value.Object, YUITest.Mock.Value.Function],
            run: function (files, options, callback) {
                callback();
            }
        });
        loader.BuilderClass = function (name, group) {
            this.compile = function (meta) {
                A.isObject(meta);
            };
            this.data = {
                js: 'content of loader-foo.js',
                json: {
                    mod1: 'json version of loader-foo.js'
                }
            };
        };
        plugin.bundleUpdated({
            bundle: bundle,
            files: {
                'bar.js': { fullPath: 'bar.js' },
                'baz.js': { fullPath: 'baz.js' },
                'path/to/something.js': { fullPath: 'path/to/something.js' }
            }
        }, api);
        YUITest.Mock.verify(api);
        YUITest.Mock.verify(loader);
    }
}));

YUITest.TestRunner.add(suite);

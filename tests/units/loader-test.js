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
        var plugin = loader.locatorLoader();
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.isFunction(plugin.bundleUpdated, "missing bundleUpdated member on plugin instance");
        A.isArray(plugin.describe.shifterBuildArgs, "default shifter options should be honored");
    },

    "test plugin constructor with custom settings": function () {
        var plugin = loader.locatorLoader({
            summary: 1,
            types: 2,
            shifterBuildArgs: ['4'],
            more: 3
        });
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.areSame(1, plugin.describe.summary);
        A.areSame(2, plugin.describe.types);
        A.areSame(3, plugin.describe.more);
        A.areSame('4', plugin.describe.shifterBuildArgs[0]);
    },

    "test register": function () {
        loader.register('foo', __dirname, 1);
        loader.register('bar', __filename, 2);
        loader.register('foo', __dirname, 3);
        A.areSame(3, loader._bundles.foo[__dirname]);
        A.areSame(2, loader._bundles.bar[__filename]);
    },

    "test plugin without any modules registered": function () {
        var plugin = loader.locatorLoader(),
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

    "test plugin flow with register and attach": function () {
        var plugin = loader.locatorLoader({
                register: true,
                attach: true
            }),
            api = YUITest.Mock();

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
                return ['bar.js', 'baz.js'];
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
            callCount: 2,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return {
                    builds: {
                        bar: {
                            config: {
                                requires: ['json-stringify'],
                                condition: {
                                    test: 'tests/fixtures/mod-valid1/meta/condtest.js'
                                }
                            }
                        },
                        baz: {
                            config: {
                                requires: ['json-parse']
                            }
                        }
                    }
                };
            }
        });
        YUITest.Mock.expect(loader, {
            method: 'registerGroup',
            args: ['foo', '/path/to/yui-build', __filename]
        });
        YUITest.Mock.expect(loader, {
            method: 'attachModules',
            args: ['foo', 'json version of loader-foo.js']
        });
        YUITest.Mock.expect(loader, {
            method: 'shiftFiles',
            args: [YUITest.Mock.Value.Any, YUITest.Mock.Value.String, YUITest.Mock.Value.Any, YUITest.Mock.Value.Function],
            run: function (files, yuiBuildDirectory, shifterBuildArgs, callback) {
                callback();
            }
        });
        loader.BuilderClass = function (name, group) {
            this.compile = function (meta) {
                A.isObject(meta);
            };
            this.data = {
                js: 'content of loader-foo.js',
                json: 'json version of loader-foo.js'
            };
        };
        var bundle = {
            name: 'foo',
            buildDirectory: '/path/to'
        };
        plugin.bundleUpdated({
            bundle: bundle,
            files: {
                'bar.js': { fullPath: 'bar.js' },
                'baz.js': { fullPath: 'baz.js' }
            }
        }, api);
        YUITest.Mock.verify(api);
        YUITest.Mock.verify(loader);
    }
}));

YUITest.TestRunner.add(suite);

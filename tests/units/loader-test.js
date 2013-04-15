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
    },

    "test constructor": function () {
        A.isNotNull(loader, "loader require failed");
    },

    "test plugin constructor": function () {
        var plugin = loader.locatorLoader();
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.isFunction(plugin.bundleUpdated, "missing bundleUpdated member on plugin instance");
    },

    "test plugin constructor with custom settings": function () {
        var plugin = loader.locatorLoader({
            summary: 1,
            types: 2,
            more: 3
        });
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.areSame(1, plugin.describe.summary);
        A.areSame(2, plugin.describe.types);
        A.areSame(3, plugin.describe.more);
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
            result;

        result = plugin.bundleUpdated({
            bundle: {
                name: 'foo'
            }
        }, {});
        A.isUndefined(result);
    },

    "test plugin flow": function () {
        var plugin = loader.locatorLoader(),
            result,
            api = YUITest.Mock();

        YUITest.Mock.expect(api, {
            method: 'writeFileInBundle',
            args: ['foo', 'loader.js', YUITest.Mock.Value.String],
            run: function (bundleName, destination_path, contents) {
                A.isTrue(contents.indexOf('"bar": {') > 0);
                A.isTrue(contents.indexOf('"baz": {') > 0);
                A.isTrue(contents.indexOf('"loader-foo": {') > 0);
                return {
                    // mocking promise
                    then: function (fn) {
                        return fn(__filename);
                    }
                };
            }
        });
        // registering groups
        loader.register('foo', __dirname, {
            builds: {
                bar: {
                    config: {
                        requires: ['json-stringify']
                    }
                },
                baz: {
                    config: {
                        requires: ['json-parse']
                    }
                }
            }
        });
        result = plugin.bundleUpdated({
            bundle: {
                name: 'foo'
            }
        }, api);
        A.areSame(__filename, result);
        YUITest.Mock.verify(api);
    },

    "test plugin flow with register and attach": function () {
        var plugin = loader.locatorLoader({
                register: true,
                attach: true
            }),
            result,
            api = YUITest.Mock();

        YUITest.Mock.expect(api, {
            method: 'writeFileInBundle',
            args: ['foo', 'loader.js', YUITest.Mock.Value.String],
            run: function (bundleName, destination_path, contents) {
                A.isTrue(contents.indexOf('"bar": {') > 0);
                A.isTrue(contents.indexOf('"baz": {') > 0);
                A.isTrue(contents.indexOf('"loader-foo": {') > 0);
                return {
                    // mocking promise
                    then: function (fn) {
                        return fn(__filename);
                    }
                };
            }
        });
        YUITest.Mock.expect(loader, {
            method: 'registerGroup',
            args: ['foo', 'path/to/build', __filename],
            run: function (bundleName, yuiBuildDirectory, newfile) {}
        });
        YUITest.Mock.expect(loader, {
            method: 'attachModules',
            args: ['foo', YUITest.Mock.Value.Object],
            run: function (bundleName, obj) {
                A.areSame('foo', obj.bar.group);
                A.areSame('json-stringify', obj.bar.requires[0]);
            }
        });
        // registering groups
        loader.register('foo', __dirname, {
            builds: {
                bar: {
                    config: {
                        requires: ['json-stringify']
                    }
                },
                baz: {
                    config: {
                        requires: ['json-parse']
                    }
                }
            }
        });
        result = plugin.bundleUpdated({
            bundle: {
                name: 'foo',
                yuiBuildDirectory: 'path/to/build'
            }
        }, api);
        A.areSame(__filename, result);
        YUITest.Mock.verify(api);
        YUITest.Mock.verify(loader);
    }
}));

YUITest.TestRunner.add(suite);

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
    loader = require('../../lib/loader.js'),
    _buildsInBundle = loader._buildsInBundle;

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
        delete loader.config;
        loader._buildsInBundle = _buildsInBundle;
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
        A.isUndefined(plugin.bundleUpdated({
            bundle: {
                name: 'foo',
                buildDirectory: __dirname
            }
        }, api));
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
                return relativePath === 'bar.js'; // denying all except bar.js
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
        YUITest.Mock.expect(loader, {
            method: '_buildsInBundle',
            args: [YUITest.Mock.Value.Object, YUITest.Mock.Value.Any, YUITest.Mock.Value.Any],
            run: function (bundle, modifiedFiles) {
                A.areSame(1, modifiedFiles.length, 'only bar.js shuould pass the filter');
                A.areSame(__dirname + '/bar.js', modifiedFiles[0], 'fullpath for bar.js should be produced');
                return [];
            }
        });
        A.isUndefined(plugin.bundleUpdated({
            bundle: {
                name: 'foo',
                buildDirectory: __dirname
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
                registerServerModules: true
            }),
            api = YUITest.Mock(),
            bundle = {
                name: 'foo',
                buildDirectory: '/path/to/foo-a.b.c',
                useServerModules: ['mod1']
            };

        YUITest.Mock.expect(api, {
            method: 'getRootBundleName',
            args: [],
            run: function () {
                return true;
            }
        });
        YUITest.Mock.expect(api, {
            method: 'writeFileInBundle',
            args: ['foo', 'loader-foo.js', YUITest.Mock.Value.String],
            run: function (bundleName, destination_path, contents) {
                A.areSame('content of loader-foo.js', contents);
                return {
                    // mocking promise
                    then: function (fn) {
                        return {
                            then: function() {
                                fn(__filename);
                            }
                        };
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
            args: ['foo', '/path/to/foo-a.b.c', __filename]
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
            args: [YUITest.Mock.Value.Any],
            run: function (modules) {
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
    },
    "test _cssprocInBundle": function () {
        var bundle = {
                name: 'foo',
                buildDirectory: '/path/to/foo-a.b.c'
            },
            args;

        loader.config = function () {
            return {
                groups: {
                    foo: {
                        base: 'base-for-foo'
                    }
                }
            };
        };

        args = loader._cssprocInBundle(bundle);
        A.areEqual(0, args.length, 'undefined cssproc should not add any arg');
        args = loader._cssprocInBundle(bundle, false);
        A.areEqual(0, args.length, 'false cssproc should not add any arg');
        args = loader._cssprocInBundle(bundle, true);
        A.areEqual(2, args.length, 'true cssproc should add two args');
        A.areEqual('--cssproc', args[0]);
        A.areEqual('base-for-foo', args[1]);
    },
    'test _filterFilesInBundle': function () {
        var bundle = {
                name: 'foo',
                buildDirectory: '/path/to/foo-a.b.c'
            },
            files,
            list = {
                'foo': {
                    relativePath: 'path/to/foo',
                    fullPath: '/fullpath/to/foo'
                },
                'bar': {
                    relativePath: 'path/to/bar',
                    fullPath: '/fullpath/to/bar'
                }
            };

        function filter(b, relativePath) {
            A.areEqual(bundle, b, 'the original bundle should be passed into filter');
            return relativePath === 'path/to/foo';
        }

        files = loader._filterFilesInBundle(bundle);
        A.areEqual(0, files.length, 'no list and filter should return empty list');

        files = loader._filterFilesInBundle(bundle, list);
        A.areEqual(2, files.length, 'no filter should return all items');
        A.areEqual('/fullpath/to/foo', files[0]);
        A.areEqual('/fullpath/to/bar', files[1]);

        files = loader._filterFilesInBundle(bundle, null, filter);
        A.areEqual(0, files.length, 'no list should return empty list');

        files = loader._filterFilesInBundle(bundle, list, filter);
        A.areEqual(1, files.length, 'filter should only processed foo');
        A.areEqual('/fullpath/to/foo', files[0]);
    },
    'test _buildsInBundle for yui modules': function () {
        var bundle = {
                name: 'foo',
                buildDirectory: '/path/build'
            },
            files, modifiedFiles, jsonFiles;

        YUITest.Mock.expect(loader, {
            method: '_checkYUIModule',
            callCount: 5,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return '_checkYUIModule result';
            }
        });

        modifiedFiles = [];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(0, files.length, 'no need to build any file in bundle');

        modifiedFiles = ['/path/src/foo/bar/baz.js'];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(1, files.length, 'baz.js in source');

        modifiedFiles = ['/path/build/foo/bar/baz.js'];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(1, files.length, 'build.json in build');

        modifiedFiles = ['/path/foo.js'];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(1, files.length, 'foo.js at the top level with possible yui module within build');

        modifiedFiles = ['/path/foo.js', '/path/foo.js'];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(1, files.length, 'dedupe on foo.js at the top level with possible yui module within build');

        YUITest.Mock.verify(loader);
    },
    'test _buildsInBundle for non yui modules': function () {
        var bundle = {
                name: 'foo',
                buildDirectory: '/path/build'
            },
            files, modifiedFiles, jsonFiles;

        YUITest.Mock.expect(loader, {
            method: '_checkYUIModule',
            callCount: 1,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return null;
            }
        });

        modifiedFiles = ['/path/src/foo/bar/baz.js'];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(0, files.length, 'baz.js which is not a js file');

        YUITest.Mock.verify(loader);
    },
    'test _buildsInBundle for build.json': function () {
        var bundle = {
                name: 'foo',
                buildDirectory: '/path/build'
            },
            files, modifiedFiles, jsonFiles;

        YUITest.Mock.expect(loader, {
            method: '_checkYUIModule',
            callCount: 3,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return null;
            }
        });
        YUITest.Mock.expect(loader, {
            method: '_checkBuildFile',
            callCount: 4,
            args: [YUITest.Mock.Value.String],
            run: function () {
                return '_checkBuildFile result';
            }
        });

        modifiedFiles = [];
        jsonFiles = [];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(0, files.length, 'no need to build any file in bundle');

        modifiedFiles = ['/path/src/build.json'];
        jsonFiles = ['/path/src/build.json'];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(1, files.length, 'simple build.json');

        modifiedFiles = ['/path/src/foo/bar/baz.js'];
        jsonFiles = ['/path/src/build.json'];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(1, files.length, 'build.json with a possible yui module in range');

        modifiedFiles = ['/path/build/foo/bar/baz.js'];
        jsonFiles = ['/path/src/build.json'];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(0, files.length, 'build.json with a possible yui module off range');

        modifiedFiles = ['/path/build/foo.js'];
        jsonFiles = ['/path/build.json'];
        files = loader._buildsInBundle(bundle, modifiedFiles, jsonFiles);
        A.areEqual(0, files.length, 'build.json at the top level with possible yui module within build');

        YUITest.Mock.verify(loader);
    }
}));

YUITest.TestRunner.add(suite);

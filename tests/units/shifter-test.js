/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

var YUITest = require('yuitest'),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    libpath = require('path'),
    mockery = require('mockery'),
    suite,
    shifter,
    childMockFn;

// mocking win-spawn
mockspawn = function () {
    return childMockFn();
};
mockery.registerMock('win-spawn', mockspawn);
mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
});

// forcing mode to be development
process.env.NODE_ENV = 'development';

// requiring component
shifter = require('../../lib/shifter.js');

suite = new YUITest.TestSuite("shifter-plugin-test suite");

suite.add(new YUITest.TestCase({
    name: "yui-test",

    "test constructor": function () {
        A.isNotNull(shifter, "shifter require failed");
    },

    "test plugin constructor": function () {
        var plugin = shifter.locatorShifter();
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.isFunction(plugin.fileUpdated, "missing updateFile member on plugin instance");
    },

    "test plugin constructor with custom settings": function () {
        var plugin = shifter.locatorShifter({
            summary: 1,
            extensions: 2,
            shifterBuildArgs: ['3']
        });
        A.isObject(plugin, "failing to create a plugin object");
        A.isObject(plugin.describe, "missing describe member on plugin instance");
        A.areSame(1, plugin.describe.summary);
        A.areSame(2, plugin.describe.extensions);
        A.areSame('3', plugin.describe.shifterBuildArgs[0]);
    },

    "test plugin flow": function () {
        var plugin = shifter.locatorShifter(),
            result;
        YUITest.Mock.expect(shifter, {
            method: 'register',
            args: ['foo', libpath.join(__dirname, '..', 'fixtures/app-module.js'), YUITest.Mock.Value.Object]
        });
        result = plugin.fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'js',
                fullPath: libpath.join(__dirname, '..', 'fixtures', 'app-module.js')
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
                return {
                    buildDirectory: './build'
                };
            },
            promise: function () {
                return 1;
            }
        });
        A.areSame(1, result);
        YUITest.Mock.verify(shifter);
    },

    "test plugin with build.json": function () {
        var plugin = shifter.locatorShifter(),
            result;
        YUITest.Mock.expect(shifter, {
            method: 'register',
            args: ['foo', libpath.join(__dirname, '..', 'fixtures/mod-valid1/build.json'), YUITest.Mock.Value.Object],
            run: function (b, f, mod) {
                A.isObject(mod.builds);
                A.isObject(mod.builds.foo);
                A.isObject(mod.builds.bar);
                A.areSame('bar', mod.builds.foo.config.requires[0]);
                A.areSame('json-parse', mod.builds.bar.config.requires[0]);
            }
        });
        result = plugin.fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'json',
                fullPath: libpath.join(__dirname, '..', 'fixtures/mod-valid1/build.json')
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
                return {
                    buildDirectory: './build'
                };
            },
            promise: function () {
                return 1;
            }
        });
        A.areSame(1, result);
        YUITest.Mock.verify(shifter);
    },

    "test plugin with invalid yui module": function () {
        var result = shifter.locatorShifter().fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'js',
                fullPath: __filename
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
            }
        });
        A.isUndefined(result);
    },

    "test plugin with fulfilled promise": function () {
        var plugin = shifter.locatorShifter(),
            result,
            child = YUITest.Mock();
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            run: function (evt, fn) {
                fn();
            }
        });
        shifter.register = function () {};
        childMockFn = function () {
            return child;
        };
        result = plugin.fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'js',
                fullPath: libpath.join(__dirname, '..', 'fixtures', 'app-module.js')
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
                return {
                    buildDirectory: './build'
                };
            },
            promise: function (fn) {
                fn(function (value) {
                    YUITest.Mock.verify(child);
                    A.isUndefined(value);
                }, function () {
                    YUITest.Mock.verify(child);
                    A.fail('The promise should be fulfilled');
                });
                return 1;
            }
        });
        A.areSame(1, result);
    },

    "test plugin with rejected promise": function () {
        var plugin = shifter.locatorShifter(),
            result,
            child = YUITest.Mock();
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            run: function (evt, fn) {
                fn(new Error('trigger to reject the promise'));
            }
        });
        shifter.register = function () {};
        childMockFn = function () {
            return child;
        };
        result = plugin.fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'js',
                fullPath: libpath.join(__dirname, '..', 'fixtures', 'app-module.js')
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
                return {
                    buildDirectory: './build'
                };
            },
            promise: function (fn) {
                fn(function (value) {
                    YUITest.Mock.verify(child);
                    A.fail('The promise should be rejected');
                }, function (err) {
                    YUITest.Mock.verify(child);
                    A.isObject(err);
                });
                return 1;
            }
        });
        A.areSame(1, result);
    },

    "test plugin with invalid build.json": function () {
        var plugin = shifter.locatorShifter(),
            result;
        result = plugin.fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'json',
                fullPath: libpath.join(__dirname, '..', 'fixtures/mod-invalid2/build.json')
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
                return {
                    buildDirectory: './build'
                };
            }
        });
        A.isUndefined(result);
    },

    "test plugin with invalid meta file": function () {
        var plugin = shifter.locatorShifter(),
            result;
        result = plugin.fileUpdated({
            file: {
                bundleName: 'foo',
                ext: 'json',
                fullPath: libpath.join(__dirname, '..', 'fixtures/mod-invalid1/build.json')
            }
        }, {
            getBundle: function (name) {
                A.areSame('foo', name);
                return {
                    buildDirectory: './build'
                };
            }
        });
        A.isUndefined(result);
    }

}));

YUITest.TestRunner.add(suite);
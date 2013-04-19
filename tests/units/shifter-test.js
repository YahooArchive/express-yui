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
    libpath = require('path'),
    mockery = require('mockery'),
    tmp = require('tmp'),
    suite,
    shifter,
    childMockFn,
    mockspawn,
    fixture = libpath.join(__dirname, '..', 'fixtures'),
    tmpFolder = function () {
        var tmpNames = [ 'TMPDIR', 'TMP', 'TEMP' ],
            i;
        for (i = 0; i < tmpNames.length; i += 1) {
            if (typeof process.env[tmpNames[i]] !== 'undefined') {
                return process.env[tmpNames[i]];
            }
        }
        return '/tmp'; // fallback to the default
    };

// mocking win-spawn
mockspawn = function () {
    return childMockFn.apply(this, arguments);
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

suite = new YUITest.TestSuite("shifter-test suite");

suite.add(new YUITest.TestCase({
    name: "shifter-test",

    setUp: function () {
        // nothing
    },

    tearDown: function () {
        // unregister mocks
    },

    "test constructor": function () {
        A.isNotNull(shifter, "shifter require failed");
    },

    "test _checkYUIModule": function () {
        var result;

        result = shifter._checkYUIModule(libpath.join(fixture, 'app-module.js'));
        A.isObject(result, 'parsing fixtures/app-module.js');
        A.isObject(result.builds['app-module'].config.requires, 'reading fixtures/app-module.js');

        result = shifter._checkYUIModule(libpath.join(fixture, 'metas-parsed-error.js'));
        A.isUndefined(result, 'parsin fixtures/metas-parsed-error.js');

        result = shifter._checkYUIModule(libpath.join(fixture, 'metas.js'));
        A.isObject(result, 'parsin fixtures/metas.js');
        A.isObject(result.builds.metas.config.requires, 'reading fixtures/metas.js');

        result = shifter._checkYUIModule(libpath.join(fixture, 'metas-run-error.js'));
        A.isObject(result, 'parsing fixtures/metas-run-error.js');
        A.isObject(result.builds.metas.config.requires, 'reading fixtures/metas-run-error.js');

        result = shifter._checkBuildFile(libpath.join(fixture, 'whatever-that-does-not-exist.js'));
        A.isUndefined(result, 'parsing fixtures/whatever-that-does-not-exist.js');
    },

    "test _checkBuildFile": function () {
        var result;

        result = shifter._checkBuildFile(libpath.join(fixture, 'mod-valid1/build.json'));
        A.isObject(result, 'parsing fixtures/mod-valid1/build.json');
        A.areSame("bar", result.builds.foo.config.requires[0], 'reading mod-valid1/build.json');
        A.areSame("json-parse", result.builds.bar.config.requires[0], 'reading meta/bar.json configs');

        result = shifter._checkBuildFile(libpath.join(fixture, 'mod-invalid1/build.json'));
        A.isUndefined(result, 'parsing fixtures/mod-invalid1/build.json');

        result = shifter._checkBuildFile(libpath.join(fixture, 'mod-invalid2/build.json'));
        A.isUndefined(result, 'parsing fixtures/mod-invalid2/build.json');

        result = shifter._checkBuildFile(libpath.join(fixture, 'whatever-that-does-not-exist.json'));
        A.isUndefined(result, 'parsing fixtures/whatever-that-does-not-exist.json');
    },

    "test shiftFiles without files": function () {
        var result,
            child = YUITest.Mock();
        YUITest.Mock.expect(child, {
            method: 'on',
            callCount: 0
        });
        childMockFn = function () {
            return child;
        };
        shifter.shiftFiles([], { buildDir: tmpFolder() }, function (err) {
            A.isNull(err, 'not error is expected');
        });
        YUITest.Mock.verify(child);
    },

    "test shiftFiles with js files": function () {
        var child = YUITest.Mock(),
            files = [libpath.join(fixture, 'app-module.js'), libpath.join(fixture, 'metas.js')];
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            callCount: 2,
            run: function (evt, fn) {
                fn();
            }
        });
        childMockFn = function (command, args) {
            A.areSame('something', args[args.length - 2]);
            A.areSame('another', args[args.length - 1]);
            A.isTrue(args.indexOf('--yui-module') >= 0);
            return child;
        };
        shifter.shiftFiles(files, {
            buildDir: tmpFolder(),
            args: ['something', 'another']
        }, function (err) {
            A.isNull(err, 'no error is expected');
        });
        YUITest.Mock.verify(child);
    },

    "test shiftFiles with build.json": function () {
        var child = YUITest.Mock(),
            files = [libpath.join(fixture, 'mod-valid1/build.json')];
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            callCount: 1,
            run: function (evt, fn) {
                fn();
            }
        });
        childMockFn = function (command, args) {
            A.areSame('something', args[args.length - 2]);
            A.areSame('another', args[args.length - 1]);
            A.isTrue(args.indexOf('--config') >= 0);
            return child;
        };
        shifter.shiftFiles(files, {
            buildDir: tmpFolder(),
            args: ['something', 'another']
        }, function (err) {
            A.isNull(err, 'no error is expected');
        });
        YUITest.Mock.verify(child);
    },

    "test shiftFiles with exit code": function () {
        var child = YUITest.Mock();
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            callCount: 1,
            run: function (evt, fn) {
                fn(1);
            }
        });
        childMockFn = function (command, args) {
            return child;
        };
        shifter.shiftFiles([libpath.join(fixture, 'app-module.js')], { buildDir: tmpFolder() }, function (err) {
            A.isObject(err, 'error is expected to bubble up from spawn');
        });
        YUITest.Mock.verify(child);
    },

    "test _isCached": function () {
        var self = this;

        // creating a unique and temporary folder to validate the cache mechanism
        tmp.dir(function (err, path) {
            self.resume(function () {
                if (err || !path) {
                    A.fail('unable to create a temporary folder to test');
                }
                A.isFalse(shifter._isCached(libpath.join(fixture, 'app-module.js'), path), 'first call');
                A.isTrue(shifter._isCached(libpath.join(fixture, 'app-module.js'), path), 'second call after caching it');
                A.isFalse(shifter._isCached(libpath.join(fixture, 'mod-valid1/build.json'), path), 'first call for a json file');
                A.isFalse(shifter._isCached(libpath.join(fixture, 'mod-valid1/build.json'), path), 'second call for a json ile');
            });
        });
        this.wait();
    },

    "test BuilderClass": function () {

        var obj = new (shifter.BuilderClass)({
                name: 'the-module-name',
                group: 'the-group-name'
            }),
            mods = shifter._checkBuildFile(libpath.join(fixture, 'mod-valid1/build.json'));

        obj.compile({
            'build.json': mods
        });
        A.isTrue(obj.data.js.indexOf('"bar": {') > 0, 'bar module should be in meta');
        A.isTrue(obj.data.js.indexOf('"foo": {') > 0, 'foo module should be in meta');
        A.isTrue(obj.data.js.indexOf('"group": "the-group-name"') > 0, 'the group name should be honored');
        A.isTrue(obj.data.js.indexOf('return Y.UA.android') > 0, 'condition for android should be honored');
    }

}));

YUITest.TestRunner.add(suite);

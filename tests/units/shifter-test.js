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
    childMockFn,
    mockspawn;

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

        result = shifter._checkYUIModule(libpath.join(__dirname, '..', 'fixtures/app-module.js'));
        A.isObject(result, 'parsing fixtures/app-module.js');
        A.isObject(result.builds['app-module'].config.requires, 'reading fixtures/app-module.js');

        result = shifter._checkYUIModule(libpath.join(__dirname, '..', 'fixtures/metas-parsed-error.js'));
        A.isUndefined(result, 'parsin fixtures/metas-parsed-error.js');

        result = shifter._checkYUIModule(libpath.join(__dirname, '..', 'fixtures/metas.js'));
        A.isObject(result, 'parsin fixtures/metas.js');
        A.isObject(result.builds.metas.config.requires, 'reading fixtures/metas.js');

        result = shifter._checkYUIModule(libpath.join(__dirname, '..', 'fixtures/metas-run-error.js'));
        A.isObject(result, 'parsing fixtures/metas-run-error.js');
        A.isObject(result.builds.metas.config.requires, 'reading fixtures/metas-run-error.js');

        result = shifter._checkBuildFile(libpath.join(__dirname, '..', 'fixtures/whatever-that-does-not-exist.js'));
        A.isUndefined(result, 'parsing fixtures/whatever-that-does-not-exist.js');
    },

    "test _checkBuildFile": function () {
        var result;

        result = shifter._checkBuildFile(libpath.join(__dirname, '..', 'fixtures/mod-valid1/build.json'));
        A.isObject(result, 'parsing fixtures/mod-valid1/build.json');
        A.areSame("bar", result.builds.foo.config.requires[0], 'reading mod-valid1/build.json');
        A.areSame("json-parse", result.builds.bar.config.requires[0], 'reading meta/bar.json configs');
        
        result = shifter._checkBuildFile(libpath.join(__dirname, '..', 'fixtures/mod-invalid1/build.json'));
        A.isUndefined(result, 'parsing fixtures/mod-invalid1/build.json');

        result = shifter._checkBuildFile(libpath.join(__dirname, '..', 'fixtures/mod-invalid2/build.json'));
        A.isUndefined(result, 'parsing fixtures/mod-invalid2/build.json');

        result = shifter._checkBuildFile(libpath.join(__dirname, '..', 'fixtures/whatever-that-does-not-exist.json'));
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
        shifter.shiftFiles([], __dirname, [], function (err) {
            A.isNull(err, 'not error is expected');
        });
        YUITest.Mock.verify(child);
    },

    "test shiftFiles with js files": function () {
        var child = YUITest.Mock();
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            callCount: 2,
            run: function (evt, fn) {
                fn();
            }
        });
        childMockFn = function (command, args) {
            A.areSame('something', args[args.length-2]);
            A.areSame('another', args[args.length-1]);
            A.isTrue(args.indexOf('--yui-module') >= 0);
            return child;
        };
        shifter.shiftFiles(['foo.js', 'bar.js'], __dirname, ['something', 'another'], function (err) {
            A.isNull(err, 'no error is expected');
        });
        YUITest.Mock.verify(child);
    },

    "test shiftFiles with build.json": function () {
        var child = YUITest.Mock();
        YUITest.Mock.expect(child, {
            method: 'on',
            args: ['exit', YUITest.Mock.Value.Function],
            callCount: 1,
            run: function (evt, fn) {
                fn();
            }
        });
        childMockFn = function (command, args) {
            A.areSame('something', args[args.length-2]);
            A.areSame('another', args[args.length-1]);
            A.isTrue(args.indexOf('--config') >= 0);
            return child;
        };
        shifter.shiftFiles(['build.json'], __dirname, ['something', 'another'], function (err) {
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
        shifter.shiftFiles(['foo.js'], __dirname, [], function (err) {
            A.isObject(err, 'error is expected to bubble up from spawn');
        });
        YUITest.Mock.verify(child);
    },

    "test BuilderClass": function () {
        
        var obj = new (shifter.BuilderClass)({
                name: 'the-module-name',
                group: 'the-group-name'
            }),
            mods = shifter._checkBuildFile(libpath.join(__dirname, '..', 'fixtures/mod-valid1/build.json'));

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
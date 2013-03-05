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
    groups = require('../lib/groups.js');

suite = new YUITest.TestSuite("group-test suite");

suite.add(new YUITest.TestCase({
    name: "group-test",

    "test constructor": function () {
        A.isNotNull(groups, "groups require failed");
    },

    "test getGroupConfig": function () {
        A.isFunction(groups.getGroupConfig);

        var res,
            fn,
            fnCalled = false;
        fn = groups._captureYUIModuleDetails;
        groups._captureYUIModuleDetails = function (res, runSandbox) {
            fnCalled = true;
            res.foo = 'bar';
            A.areEqual(__dirname + '/app-module.js',
                       res.path,
                       'res.path does not match original path');
        };
        res = groups.getGroupConfig(__dirname + '/app-module.js');

        A.areEqual(true, fnCalled, 'captureFn was not called');
        A.areEqual('bar', res.foo, 'res.foo should exists');

        groups._captureYUIModuleDetails = fn;
    },

    "test captureYUI": function () {
        A.isFunction(groups._captureYUIModuleDetails);

        var res,
            sandbox;

        res = {
            path: __dirname + '/app-module.js'
        };
        sandbox = { };
        groups._captureYUIModuleDetails(res, sandbox);

        A.isNotUndefined(res.yui, 'res.yui was not set');
        console.log(res.yui);
        require('util').inspect(res.yui);
    }
}));

YUITest.TestRunner.add(suite);

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
    groups = require('../lib/groups.js'),
    moduleConfigPath = __dirname + '/../fixtures/app-module.js',
    moduleConfigPath2 = __dirname + '/../fixtures/metas.js';


suite = new YUITest.TestSuite("group-test suite");

suite.add(new YUITest.TestCase({
    name: "group-test",

    "test constructor": function () {
        A.isNotNull(groups, "groups require failed");
    },

    "test getGroupConfig (only)": function () {
        A.isFunction(groups.getGroupConfig);

        var res,
            fn,
            fnCalled = false;
        fn = groups._captureYUIModuleDetails;
        groups._captureYUIModuleDetails = function (res, runSandbox) {
            fnCalled = true;
            res.yui = { foo: 'bar' };
            A.areEqual(moduleConfigPath,
                       res.path,
                       'res.path does not match original path');
        };
        res = groups.getGroupConfig(moduleConfigPath);

        A.areEqual(true, fnCalled, 'captureFn was not called');
        // A.areEqual('bar', res.yui.foo, 'res.yui.foo should exists');

        groups._captureYUIModuleDetails = fn;
    },
    
    "test captureYUIModuleDetails": function () {
        A.isFunction(groups._captureYUIModuleDetails);

        // TODO: add more asserts
    },

    "test getGroupConfig": function () {

        var config;
        config = groups.getGroupConfig(moduleConfigPath);

        // verify
        A.areEqual('app-module', config.name, 'config.name does not match');
        A.areEqual('0.0.1', config.version, 'config.version does not match');
        A.areEqual('yui-base', config.meta.requires[0], 'yui-base does not match');
        A.areEqual('loader-base', config.meta.requires[1], 'loader-base does not match');
        A.areEqual('loader-yui3', config.meta.requires[2], 'loader-yui3 does not match');
        A.isNotUndefined(config.groups, 'config.groups undefined');
        A.areEqual('app', config.groups.name, 'groups name mismatch');
        A.isNotUndefined(config.groups.modules['module-A'], 'module-A missing');
        A.isNotUndefined(config.groups.modules['module-B'], 'module-A missing');

        A.areEqual('module-B',
                   config.groups.modules['module-A'].requires[0],
                   'module-B is a dependency of module-A');

    },

    "test metas": function () {

        A.isFunction(groups.getGroupConfig);
        var config;
        config = groups.getGroupConfig(moduleConfigPath2);

        A.areEqual('metas', config.name, 'config.name mismatch');
        A.areEqual('0.0.1', config.version, 'config.version mismatch');
        A.isNotUndefined(config.groups.modules,
                         'config.groups.modules should be set');
        A.areEqual('css',
                   config.groups.modules.xyz.type,
                   'wrong type');
        A.areEqual('baz',
                   config.groups.modules.xyz.requires[0],
                   'wrong requires');
    }
}));

YUITest.TestRunner.add(suite);

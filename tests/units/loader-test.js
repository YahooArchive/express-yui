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
        delete loader._bundles;
        result = plugin.bundleUpdated({
            bundle: {
                name: 'foo'
            }
        }, {});
        A.isUndefined(result);
    }

}));

YUITest.TestRunner.add(suite);

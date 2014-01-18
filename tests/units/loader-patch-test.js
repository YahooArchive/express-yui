/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

'use strict';

var YUITest = require('yuitest'),
    Assert  = YUITest.Assert,
    path    = '../../lib/loader-patch.js',
    patch,
    context,
    suite;

suite = new YUITest.TestSuite('loader-patch-test suite');

suite.add(new YUITest.TestCase({
    name: 'clientside loader-patch-test',

    setUp: function () {
        var config = {
            patches: []
        };

        patch = require(path);
        context = {
            config: function () {
                return config;
            }
        };
    },

    tearDown: function () {
        patch   = null;
        context = null;
    },

    'test patchClient': function () {
        var patches = context.config().patches,
            prev = patches.length,
            next = [];

        patch.patchClient.apply(context, [function firstPatch() {}]);
        Assert.areEqual(prev + 1, patches.length, 'Failed to add one clientside patches');

        patch.patchClient.apply(context, [function secondPatch() {}, function thridPatch() {}]);
        Assert.areEqual(prev + 3, patches.length, 'Failed to add multiple clientside patches');
    }

}));

suite.add(new YUITest.TestCase({
    name: 'serverside loader-patch-test',

    setUp: function () {
        patch = require(path);
        context = {
            _patches: []
        };
    },

    tearDown: function () {
        patch   = null;
        context = null;
    },

    'test patchServer': function () {
        var patches = context._patches,
            prev = patches.length,
            next = [];

        patch.patchServer.apply(context, [function firstPatch() {}]);
        Assert.areEqual(prev + 1, patches.length, 'Failed to add one serverside patches');

        patch.patchServer.apply(context, [function secondPatch() {}, function thridPatch() {}]);
        Assert.areEqual(prev + 3, patches.length, 'Failed to add multiple serverside patches');
    }

}));

YUITest.TestRunner.add(suite);

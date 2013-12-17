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

    'test patchClient read': function () {
        Assert.areSame(
            context.config().patches,
            patch.patchClient.call(context),
            'Failed to read client patches'
        );
    },

    'test patchClient write': function () {
        var prev = context.config().patches,
            next = [];

        patch.patchClient.call(context, next);
        Assert.areNotSame(prev, context.config().patches, 'Failed to change default clientside patches');

        patch.patchClient.call(context, prev);
        Assert.areSame(prev, context.config().patches, 'Failed to revert default clientside patches');
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

    'test patchServer read': function () {
        Assert.areSame(
            context._patches,
            patch.patchServer.call(context),
            'Failed to read server patches'
        );
    },

    'test patchServer write': function () {
        var prev = context._patches,
            next = [];

        patch.patchServer.call(context, next);
        Assert.areNotSame(prev, context._patches, 'Failed to change default serverside patches');

        patch.patchServer.call(context, prev);
        Assert.areSame(prev, context._patches, 'Failed to revert default serverside patches');
    }

}));

YUITest.TestRunner.add(suite);

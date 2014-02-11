/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

'use strict';

var YUITest = require('yuitest'),
    Assert  = YUITest.Assert,
    patch   = require('../../../lib/patches/templates-requires.js'),
    Y,
    loader,
    suite;

suite = new YUITest.TestSuite('patches/templates-requires test suite');

suite.add(new YUITest.TestCase({
    name: 'fallback to default bundles tests',

    setUp: function () {
        loader = {
            _mockGetModule: function (name) {
                return {
                    'all-template-bar': {
                        name: 'all-template-bar'
                    },
                    'all-template-baz': {
                        name: 'all-template-baz'
                    }
                }[name];
            },
            _mockGetRequires: function (mod) {
                return {
                    'foo': ['original', 'extra'],
                    'all-template-bar': ['template-base'],
                    'all-template-baz': ['template-base']
                }[mod.name] || [];
            },
            getRequires: function () { return this._mockGetRequires.apply(this, arguments); },
            getModule: function () { return this._mockGetModule.apply(this, arguments); }
        };
        Y = { config: {} };
    },

    tearDown: function () {
        loader   = null;
        Y = null;
    },

	_should: {
        error: {
            "test invalid template": true
        }
    },

    'test empty template': function () {
        var p = patch(Y, loader);
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            templates: []
        });
        Assert.areEqual(['original', 'extra'].join(','), r.join(','),
                'default requirements for foo');
    },

    'test one template': function () {
        var p = patch(Y, loader);
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            templates: ['bar']
        });
        Assert.areEqual(['template-base', 'all-template-bar', 'original', 'extra'].join(','), r.join(','),
                'bar and its requirements should be included');
    },

    'test two templates': function () {
        var p = patch(Y, loader);
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            templates: ['bar', 'baz']
        });
        Assert.areEqual(['template-base', 'all-template-bar', 'template-base', 'all-template-baz', 'original', 'extra'].join(','), r.join(','),
                'bar, baz and their requirements should be included');
    },

    'test invalid template': function () {
        var p = patch(Y, loader);
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            templates: ['invalid']
        });
        // this should throw
    }

}));

YUITest.TestRunner.add(suite);

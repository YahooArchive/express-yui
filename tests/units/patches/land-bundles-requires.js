/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

'use strict';

var YUITest = require('yuitest'),
    Assert  = YUITest.Assert,
    patch   = require('../../../lib/patches/lang-bundles-requires.js'),
    Y,
    loader,
    suite;

suite = new YUITest.TestSuite('patches/lang-bundles-requires test suite');

suite.add(new YUITest.TestCase({
    name: 'Y.config.lang tests',

    setUp: function () {
        loader = {
            _mockGetModule: function () {},
            _mockGetRequires: function () {
                return ['bar'];
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

    'test undefined lang': function () {
        var p = patch(Y, loader);
        var r = loader.getRequires({ name: 'foo', requires: [], langBundles: ['unkown'] });
        Assert.areEqual(1, r.length, 'Foo only requires bar');
    },

    'test empty lang': function () {
        var p = patch(Y, loader);
        Y.config.lang = '';
        var r = loader.getRequires({ name: 'foo', requires: [], langBundles: ['unkown'] });
        Assert.areEqual(1, r.length, 'Foo only requires bar');
    },

    'test unknown lang': function () {
        var p = patch(Y, loader);
        Y.config.lang = 'cu-CU';
        var r = loader.getRequires({ name: 'foo', requires: [], langBundles: ['unkown'] });
        Assert.areEqual(1, r.length, 'Foo only requires bar');
    },

    'test empty array lang': function () {
        var p = patch(Y, loader);
        Y.config.lang = [];
        var r = loader.getRequires({ name: 'foo', requires: [], langBundles: ['unkown'] });
        Assert.areEqual(1, r.length, 'Foo only requires bar');
    },

    'test array lang with unkown lang': function () {
        var p = patch(Y, loader);
        Y.config.lang = ['cu-CU'];
        var r = loader.getRequires({ name: 'foo', requires: [], langBundles: ['unkown'] });
        Assert.areEqual(1, r.length, 'Foo only requires bar');
    }

}));

suite.add(new YUITest.TestCase({
    name: 'fallback to default bundles tests',

    setUp: function () {
        loader = {
            _mockGetModule: function (name) {
                return {
                    'all-lang-bar': {
                        name: 'all-lang-bar'
                    },
                    'all-lang-bar_fr-fr': {
                        name: 'all-lang-bar_fr-fr'
                    }
                }[name];
            },
            _mockGetRequires: function (mod) {
                return {
                    'foo': ['original', 'extra'],
                    'all-lang-bar': ['intl'],
                    'all-lang-bar_fr-fr': ['intl']
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

    'test simple langBundle with undefined lang': function () {
        var p = patch(Y, loader);
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            langBundles: ['bar']
        });
        Assert.areEqual([ 'intl', 'all-lang-bar', 'original', 'extra'].join(','), r.join(','),
                'default lang bundle should be picked');
    },

    'test simple langBundle with unavailable lang': function () {
        var p = patch(Y, loader);
        Y.config.lang = 'cu-CU';
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            langBundles: ['bar']
        });
        Assert.areEqual([ 'intl', 'all-lang-bar', 'original', 'extra'].join(','), r.join(','),
                'default lang bundle should be picked');
    },

    'test simple langBundle with a good lang': function () {
        var p = patch(Y, loader);
        Y.config.lang = 'fr-FR';
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            langBundles: ['bar']
        });
        Assert.areEqual([ 'intl', 'all-lang-bar_fr-fr', 'original', 'extra'].join(','), r.join(','),
                'fr-FR lang bundle should be picked');
    },

    'test simple langBundle with a good array of langs': function () {
        var p = patch(Y, loader);
        Y.config.lang = ['fr-FR'];
        var r = loader.getRequires({
            name: 'foo',
            group: 'all',
            langBundles: ['bar']
        });
        Assert.areEqual([ 'intl', 'all-lang-bar_fr-fr', 'original', 'extra'].join(','), r.join(','),
                'fr-FR lang bundle should be picked');
    }

}));

YUITest.TestRunner.add(suite);

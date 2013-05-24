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
    suite,
    utils = require('../../lib/utils.js');

suite = new YUITest.TestSuite("utils-test suite");

suite.add(new YUITest.TestCase({
    name: "utils-test",

    "test tokenizeFunctions": function () {
        A.isFunction(utils.tokenizeFunctions);

        var src,
            dest,
            hash = { },
            fixture;

        src = {
            a: 'A',
            b: function () { }
        };

        dest = utils.tokenizeFunctions(src, hash, 'foo-');
        // console.log(hash);
        // { '@foo-.b@': [Function] }
        OA.hasKey('@foo-.b@', hash, 'expected key: @foo-.b@');
        A.isFunction(hash['@foo-.b@'], 'value should be a function');
    },

    "test serialize": function () {
        A.isFunction(utils.serialize);

        var fixture,
            dest,
            src;

        fixture = '{\"a\":\"A\",\"b\":function () { var foo = \'bar\'; },\"c\":[\"1\",2,\"a\"],\"d\":{\"foo\":\"bar\"},\"e\":[{\"foo\":\"bar\"},{\"bar\":\"foo\"}]}';
        src = {
            a: 'A',
            b: function () { var foo = 'bar'; },
            c: [ '1', 2, 'a'],
            d: { foo: 'bar' },
            e: [ { foo: 'bar' }, { bar: 'foo' } ]
        };

        dest = utils.serialize(src);
        // console.log(dest);
        A.areEqual(fixture, dest, 'unexpected seralized string');

    },

    "test clone": function () {
        A.isFunction(utils.clone);

        var dest,
            src;

        src = {
            a: 'A',
            b: ['1', '2', '3'],
            c: [
                {
                    a: 'A'
                },
                {
                    b: 'B'
                }
            ]
        };

        dest = utils.clone(src);

        A.areNotEqual(src, dest, 'cloned value should not point to the original object reference');
        A.areEqual(src, src, 'src should not point to the original object reference');
        A.areEqual(src.a, dest.a, 'cloned dest.a object is different from source');
        OA.areEqual(src.b, dest.b, 'cloned dest.b object is different from source');
        OA.areEqual(src.c[0], dest.c[0], 'cloned dest.c object is different from source');
    },

    'test isFunction': function () {
        A.isFunction(utils.isFunction);
        // good
        A.isTrue(utils.isFunction(function(){}), 'function(){}');
        // bad
        A.isFalse(utils.isFunction(/(blue|red)/), '/(blue|red)/');
        A.isFalse(utils.isFunction(new RegExp('foo')), 'new RegExp()');
        A.isFalse(utils.isFunction({}), '{}');
        A.isFalse(utils.isFunction(null), 'null');
        A.isFalse(utils.isFunction(false), 'false');
        A.isFalse(utils.isFunction(undefined), 'undefined');
        A.isFalse(utils.isFunction(0), '0');
        A.isFalse(utils.isFunction(1), '1');
        A.isFalse(utils.isFunction('string'), 'string');
    },

    'test isRegExp': function () {
        A.isFunction(utils.isRegExp);
        // good
        A.isTrue(utils.isRegExp(/(blue|red)/), '/(blue|red)/');
        A.isTrue(utils.isRegExp(new RegExp('foo')), 'new RegExp()');
        // bad
        A.isFalse(utils.isRegExp(function(){}), 'function(){}');
        A.isFalse(utils.isRegExp({}), '{}');
        A.isFalse(utils.isRegExp(null), 'null');
        A.isFalse(utils.isRegExp(false), 'false');
        A.isFalse(utils.isRegExp(undefined), 'undefined');
        A.isFalse(utils.isRegExp(0), '0');
        A.isFalse(utils.isRegExp(1), '1');
        A.isFalse(utils.isRegExp('string'), 'string');
    }

}));

YUITest.TestRunner.add(suite);

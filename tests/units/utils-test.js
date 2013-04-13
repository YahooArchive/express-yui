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
    modown = require('../../lib/utils.js');

suite = new YUITest.TestSuite("utils-test suite");

suite.add(new YUITest.TestCase({
    name: "utils-test",

    "test tokenizeFunctions": function () {
        A.isFunction(modown.tokenizeFunctions);

        var src,
            dest,
            hash = { },
            fixture;

        src = {
            a: 'A',
            b: function () { }
        };

        dest = modown.tokenizeFunctions(src, hash, 'foo-');
        // console.log(hash);
        // { '@foo-.b@': [Function] }
        OA.hasKey('@foo-.b@', hash, 'expected key: @foo-.b@');
        A.isFunction(hash['@foo-.b@'], 'value should be a function');
    },

    "test serialize": function () {
        A.isFunction(modown.serialize);

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

        dest = modown.serialize(src);
        // console.log(dest);
        A.areEqual(fixture, dest, 'unexpected seralized string');

    },

    "test clone": function () {
        A.isFunction(modown.clone);

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

        dest = modown.clone(src);

        A.areNotEqual(src, dest, 'cloned value should not point to the original object reference');
        A.areEqual(src, src, 'src should not point to the original object reference');
        A.areEqual(src.a, dest.a, 'cloned dest.a object is different from source');
        OA.areEqual(src.b, dest.b, 'cloned dest.b object is different from source');
        OA.areEqual(src.c[0], dest.c[0], 'cloned dest.c object is different from source');
    }
}));

YUITest.TestRunner.add(suite);

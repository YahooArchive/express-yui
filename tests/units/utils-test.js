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
    }

}));

YUITest.TestRunner.add(suite);

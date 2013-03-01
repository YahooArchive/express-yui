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
    yui = require('../lib/yui.js');

suite = new YUITest.TestSuite("yui-test suite");

suite.add(new YUITest.TestCase({
    name: "yui-test",

    "test constructor": function () {
        A.isNotNull(yui, "yui require failed");
    },

    "test expose": function () {
        A.isFunction(yui.expose);
    }
}));

YUITest.TestRunner.add(suite);

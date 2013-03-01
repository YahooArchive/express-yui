
/*jslint node:true, nomen:true*/
/*global YUI, YUITest*/

var YUITest = require('yuitest'),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    Y = YUITest,
    suite,
    yui = require('../lib/yui.js');

suite = new Y.TestSuite("yui-test suite");

suite.add(new Y.TestCase({
    name: "yui-test",

    "test constructor": function () {
        A.isNotNull(yui, "yui require failed");
    },

    "test expose": function () {
        A.isFunction(yui.expose);
    }
}));

Y.TestRunner.add(suite);

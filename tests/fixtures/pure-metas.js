/*jslint node:true*/
/*global YUI*/
YUI.add('metas', function (Y, NAME) {
    "use strict";
    YUI.Env[Y.version].modules = YUI.Env[Y.version].modules || {};
    Y.mix(YUI.Env[Y.version].modules, {
        foo: {
            group: "app",
            path: "assets/foo.js",
            requires: ["node"]
        },
        bar: {
            group: "app",
            path: "bar-hash123.js",
            requires: ["io-base", "foo"]
        },
        baz: {
            group: "app",
            path: "baz-123.css",
            type: "css"
        },
        xyz: {
            group: "app",
            path: "xyz.css",
            type: "css",
            requires: ["baz"]
        }
    });
});

/*global YUI*/
YUI.add('loader-app-modules', function (Y, NAME) {
    "use strict";
    YUI.Env[Y.version].modules = YUI.Env[Y.version].modules || {};
    Y.mix(YUI.Env[Y.version].modules, {
        'loader-app-modules': {
            group: "app-modules"
        },
        foo: {
            group: "app-modules",
            requires: ["node"]
        },
        bar: {
            group: "app-modules",
            requires: ["io-base", "foo"]
        },
        baz: {
            group: "app-modules",
            type: "css"
        },
        xyz: {
            group: "app-modules",
            type: "css",
            requires: ["baz"]
        }
    });
}, '@VERSION@');


/*jslint node:true,nomen:true*/
/*global YUI*/

YUI.add('metas', function (Y, NAME) {
    Y.applyConfig({
        // missing a { here
        groups:
            app: Y.merge((Y.config.groups && Y.config.groups.app) || {}, {
                modules: {
                    foo: {
                        path: "assets/foo.js",
                        requires: ["node"]
                    },
                    bar: {
                        path: "bar-hash123.js",
                        requires: ["io-base", "foo"]
                    },
                    baz: {
                        path: "baz-123.css",
                        type: "css"
                    },
                    xyz: {
                        path: "xyz.css",
                        type: "css",
                        requires: ["baz"]
                    }
                }
            })
        }
    });
}, '0.0.1', {requires: ['loader-base']});

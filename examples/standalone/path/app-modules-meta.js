YUI.add('app-modules-meta', function (Y, NAME) {
    Y.applyConfig({
        groups: {
            app: Y.merge((Y.config.groups && Y.config.groups.app) || {}, {
                modules: {
                    "foo": {
                        group: "app",
                        path: "path/foo.js",
                        requires: ["node-base", "json-stringify"]
                    },
                    "bar": {
                        group: "app",
                        type: "css",
                        path: "path/bar.css"
                    }
                }
            })
        }
    });
});
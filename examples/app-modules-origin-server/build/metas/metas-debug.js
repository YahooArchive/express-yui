YUI.add('metas', function (Y, NAME) {
    YUI.Env[Y.version].modules = YUI.Env[Y.version].modules || {};
    Y.mix(YUI.Env[Y.version].modules, {
        metas: {
            group: "metas"
        },
        foo: {
            group: "metas",
            requires: ["node"]
        },
        bar: {
            group: "metas",
            requires: ["io-base", "foo"]
        },
        baz: {
            group: "metas",
            type: "css"
        },
        xyz: {
            group: "metas",
            type: "css",
            requires: ["baz"]
        }
    });
}, '@VERSION@');

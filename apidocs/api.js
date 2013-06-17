YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "View",
        "cdn",
        "groups",
        "loader",
        "middleware",
        "origin",
        "seed",
        "server",
        "shifter",
        "view",
        "yui"
    ],
    "modules": [
        "cdn",
        "express-yui",
        "groups",
        "loader",
        "middleware",
        "origin",
        "seed",
        "server",
        "shifter",
        "utils",
        "view",
        "yui"
    ],
    "allModules": [
        {
            "displayName": "cdn",
            "name": "cdn",
            "description": "The `yui.cdn` extension that provides some basic configuration\nthat will facilitate the configuration of YUI to be served from\nCDN as well as custom groups to be configured to be served from\nand alternative CDN as well."
        },
        {
            "displayName": "express-yui",
            "name": "express-yui",
            "description": "The `express-yui` middleware provides the foundation and some basic\nfeatures to attach information into the `res.locals` object\nthat could be used to boot `YUI` in the client runtime."
        },
        {
            "displayName": "groups",
            "name": "groups",
            "description": "The `yui.groups` extension provides a set of utilities\nanalyze meta modules and group metada."
        },
        {
            "displayName": "loader",
            "name": "loader",
            "description": "The `yui.loader` extension exposes a locator plugin to build and register yui meta modules\nfrom shifter module metadata."
        },
        {
            "displayName": "middleware",
            "name": "middleware",
            "description": "The `express-yui` exports few middleware that provide some basic\nfeatures to attach information into the `res.locals` object\nthat could be used to boot `YUI` in the client runtime."
        },
        {
            "displayName": "origin",
            "name": "origin",
            "description": "The `express-yui.origin` extension that provides a set of features\nto mutate the express app into an origin server for yui\nmodules and static assets."
        },
        {
            "displayName": "seed",
            "name": "seed",
            "description": "The `express-yui.seed` extension that provides a set of features\nto construct the yui seed structure which contains the url\nto fetch the initial piece of the library before\ncalling `YUI().use()` in the client runtime."
        },
        {
            "displayName": "server",
            "name": "server",
            "description": "The `express-yui.server` extension that provides a set of features\nto control a YUI instance on the server side."
        },
        {
            "displayName": "shifter",
            "name": "shifter",
            "description": "The `express-yui.shifter` extension exposes a set of utilities to build yui modules\nfrom *.js or build.json files."
        },
        {
            "displayName": "utils",
            "name": "utils",
            "description": "Utility functions used across `express-yui` components."
        },
        {
            "displayName": "view",
            "name": "view",
            "description": "The `express-yui.view` extension exposes an express view class that relies on all templates\nexposed by all modules that are registered on the server side thru Loader, those\ntemplates should be using Y.Template."
        },
        {
            "displayName": "yui",
            "name": "yui"
        }
    ]
} };
});
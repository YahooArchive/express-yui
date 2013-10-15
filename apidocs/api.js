YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "ExpressYUI",
        "client",
        "middleware",
        "origin",
        "seed",
        "server",
        "utils",
        "yui"
    ],
    "modules": [
        "express-yui",
        "express-yui_lib_client",
        "express-yui_lib_middleware",
        "express-yui_lib_origin",
        "express-yui_lib_seed",
        "express-yui_lib_server",
        "express-yui_lib_utils",
        "express-yui_lib_yui"
    ],
    "allModules": [
        {
            "displayName": "express-yui",
            "name": "express-yui",
            "description": "The `express-yui` module implements an express extension to provide\nyui capabilities to express applications."
        },
        {
            "displayName": "express-yui/lib/client",
            "name": "express-yui_lib_client",
            "description": "Provides a set of features\nto control a YUI instance on the client side. This module will be\nserialized and sent to the client side thru `res.expose()` and available\nin the client side thru `window.app.yui`."
        },
        {
            "displayName": "express-yui/lib/middleware",
            "name": "express-yui_lib_middleware",
            "description": "Provides some basic features to expose yui configurations information thru `res.expose()`\nthat could be used to boot `YUI` in the client runtime. It also provide some sugar to\nexpose static assests that are YUI related."
        },
        {
            "displayName": "express-yui/lib/origin",
            "name": "express-yui_lib_origin",
            "description": "Provides a set of features to mutate the express app into an origin server for yui\nmodules and static assets."
        },
        {
            "displayName": "express-yui/lib/seed",
            "name": "express-yui_lib_seed",
            "description": "Provides a set of features to construct the yui seed structure which contains the url\nto fetch the initial piece of the library from the client runtime."
        },
        {
            "displayName": "express-yui/lib/server",
            "name": "express-yui_lib_server",
            "description": "The `express-yui/lib/server` provides a set of features\nto control a YUI instance on the server side."
        },
        {
            "displayName": "express-yui/lib/utils",
            "name": "express-yui_lib_utils",
            "description": "Utility functions used across `express-yui` components."
        },
        {
            "displayName": "express-yui/lib/yui",
            "name": "express-yui_lib_yui",
            "description": "Provides the class foundation of the `app.yui` object."
        }
    ]
} };
});
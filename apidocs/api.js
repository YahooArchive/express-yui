YUI.add("yuidoc-meta", function(Y) {
   Y.YUIDoc = { meta: {
    "classes": [
        "ExpressYUI",
        "client",
        "loader-patch",
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
        "express-yui_lib_loader-patches",
        "express-yui_lib_middleware",
        "express-yui_lib_origin",
        "express-yui_lib_patches_lang-bundles-requires",
        "express-yui_lib_patches_optional-requires",
        "express-yui_lib_patches_server-intl-get",
        "express-yui_lib_patches_templates-requires",
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
            "displayName": "express-yui/lib/loader-patches",
            "name": "express-yui_lib_loader-patches",
            "description": "Provides hooks to patch the YUI loader on both the server and/or client."
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
            "displayName": "express-yui/lib/patches/lang-bundles-requires",
            "name": "express-yui_lib_patches_lang-bundles-requires",
            "description": "Patches `Y.Loader` to support `langBundles`, which enables you to\nrequire language bundles easily while define modules.\n\nYou can write your modules like this:\n\n    YUI.add('name', function (Y) {\n        // module code...\n    }, '0.1', { requires: [], langBundles: ['foo', 'bar'] });\n\nAnd you can enable the patch like this:\n\n    app.yui.patch(require('express-yui/lib/patches/lang-bundles-requires'));\n\nThis will guarantee, that the language bundles denotated by file `lang/foo` and\n`lang/bar` will be loaded. Of course, they will be loaded based on the transpiler\noutput, which generates a more complex module name. If you don't use this patch, you will\nhave to use the full name of the generated modules to require them manually in\nthe `requires` list."
        },
        {
            "displayName": "express-yui/lib/patches/optional-requires",
            "name": "express-yui_lib_patches_optional-requires",
            "description": "Patches `Y.Loader` to support `optionalRequires`, which enables you to\nrequire modules that might not be available in a runtime, and avoid to\nthrow when that happens.\n\n!IMPORTANT/TODO: this patch can be removed once we get [PR1629][] merged\ninto YUI.\n[PR1629]: https://github.com/yui/yui3/pull/1629\n\nIt also add support for modules that are essencially polyfills,\nthis means that some modules can only be used if the test is passed first\notherwise they should be ignored.\n\nThis helps when it comes to define modules that are only available on\nthe server or client, or polyfills, while other modules that are common can require\nthem as optionals.\n\n    app.yui.patch(require('express-yui/lib/patches/optional-requires'));\n\nWhen this patch is applied, you can add a new entry called `test` in the\nmetas for a module, this entry is a functions. If the test fails, the module\nwill be automatically discarded.\n\nNote that the `optional` implementation in YUI does not cover this case,\nand it only covers the case where the module was required or not by another\nmodule in the `use` statement, which is not quite the same."
        },
        {
            "displayName": "express-yui/lib/patches/server-intl-get",
            "name": "express-yui_lib_patches_server-intl-get",
            "description": "Patches `Y.Intl.get` to use the language bundles produced by\n`locator-lang` plugin, and will be available thru locator's bundle\nobjects on the server side. You can apply this patch like this:\n\n    app.yui.patchServer(require('express-yui/lib/patches/server-intl-get'));\n\nThen you can use this in your program:\n\n    Y.Intl.get('<bundleName>/foo');\n\nThis will resolve `foo` as a language bundle from the bundle specified by name,\nwhich is normally a file in `lang/foo.json` or `lang/foo.yrb`\nthat was transpiled into a module by `locator-lang`."
        },
        {
            "displayName": "express-yui/lib/patches/templates-requires",
            "name": "express-yui_lib_patches_templates-requires",
            "description": "Patches `Y.Loader` to support `templates` requirements, which enables you to\nrequire templates easily without having to know the name of the module\ngenerated by the build transpiler/plugin/task while define modules.\n\nYou can write your modules like this:\n\n    YUI.add('name', function (Y) {\n        // module code...\n    }, '0.1', { requires: [], templates: ['foo'] });\n\nAnd you can enable the patch like this:\n\n    app.yui.patch(require('express-yui/lib/patches/templates-requires'));\n\nThis will guarantee, that the template denotated by the logical name `foo`\nwill be loaded. Of course, it will be loaded based on the transpiler\noutput, which generates a more complex module name. If you don't use this patch, you will\nhave to use the full name of the generated module."
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
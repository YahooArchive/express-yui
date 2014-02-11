/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Patches `Y.Loader` to support `optionalRequires`, which enables you to
require modules that might not be available in a runtime, and avoid to
throw when that happens.

!IMPORTANT/TODO: this patch can be removed once we get [PR1629][] merged
into YUI.
[PR1629]: https://github.com/yui/yui3/pull/1629

It also add support for modules that are essencially polyfills,
this means that some modules can only be used if the test is passed first
otherwise they should be ignored.

This helps when it comes to define modules that are only available on
the server or client, or polyfills, while other modules that are common can require
them as optionals.

    app.yui.patch(require('express-yui/lib/patches/optional-requires'));

When this patch is applied, you can add a new entry called `test` in the
metas for a module, this entry is a functions. If the test fails, the module
will be automatically discarded.

Note that the `optional` implementation in YUI does not cover this case,
and it only covers the case where the module was required or not by another
module in the `use` statement, which is not quite the same.

@module express-yui/lib/patches/optional-requires
**/
module.exports = function patchOptionalRequires(Y, loader) {
    var getRequires = loader.getRequires,
        addModule = loader.addModule;
    // patching `addModule` method to support polyfills
    loader.addModule = function (mod) {
        var configFn = mod && mod.configFn;
        if (mod && mod.test) {
            mod.configFn = function (mod) {
                if (!mod.test(Y)) {
                    // if a test fails, the module should be dropped from the registry
                    return false;
                }
                if (configFn) {
                    // falling back to the original configFn if the test passed
                    return configFn.apply(this, arguments);
                }
            };
        }
        return addModule.apply(this, arguments);
    };
    // patching `getRequires` to support optional requires
    loader.getRequires = function (mod) {
        var i, len, m,
            r = getRequires.apply(this, arguments);
        // expanding requirements with optional requires
        if (mod.optionalRequires && !mod.optionalRequiresExpanded) {
            mod.optionalRequiresExpanded = [];
            len = mod.optionalRequires.length;
            for (i = 0; i < len; i += 1) {
                m = this.getModule(mod.optionalRequires[i]);
                if (m) {
                    mod.optionalRequiresExpanded = mod.optionalRequiresExpanded.concat(this.getRequires(m), [m.name]);
                }
            }
        }
        return mod.optionalRequiresExpanded && mod.optionalRequiresExpanded.length ?
                [].concat(mod.optionalRequiresExpanded, r) : r;
    };
};

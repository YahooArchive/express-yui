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
this means that some modules can only be used if some tests are passed first
otherwise they should be ignored.

This helps when it comes to define modules that are only available on
the server or client, or polyfills, while other modules that are common can require
them as optionals.

    app.yui.patch(require('express-yui/lib/patches/optional-requires'));

When this patch is applied, you can add a new entry called `tests` in the
metas for a module, this entry is an array of strings or functions, strings
are used for named tests that were previously attached under `Y.config.tests`,
in case you want to reuse those tests between different modules. If any of the
tests fails, the module will be automatically discarded.

Note that the `optional` implementation in YUI does not cover this case,
and it only covers the case where the module was required or not by another
module in the `use` statement, which is not quite the same.

@module express-yui/lib/patches/optional-requires
**/
module.exports = function patchOptionalRequires(Y, loader) {
    var getRequires = loader.getRequires,
        addModule = loader.addModule,
        globalOptionalTests = Y.config.optionalTests;
    // patching `addModule` method to support polyfills
    loader.addModule = function (mod) {
        var configFn;
        if (mod.tests) {
            configFn = mod.configFn;
            mod.configFn = function (mod) {
                var i, len = mod.tests;
                for (i = 0; i <= len; i += 1) {
                    if (typeof mod.tests[i] === 'string') {
                        mod.tests[i] = globalOptionalTests[mod.tests[i]];
                    }
                    if (!mod.tests[i](Y)) {
                        // if a test fails, the polyfill should be dropped
                        return false;
                    }
                }
                if (configFn) {
                    // falling back to the original configFn if all tests passed
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
        if (mod.optionalRequires) {
            len = mod.optionalRequires.length;
            for (i = 0; i < len; i += 1) {
                m = this.getModule(mod.optionalRequires[i]);
                if (m) {
                    r = [].concat(this.getRequires(m), [m.name], r);
                }
            }
        }
        return r;
    };
};

/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Patches `Y.Loader` to support `langBundles`, which enables you to
require language bundles easily while define modules.

You can write your modules like this:

    YUI.add('name', function (Y) {
        // module code...
    }, '0.1', { requires: [], langBundles: ['foo', 'bar'] });

And you can enable the patch like this:

    app.yui.patch(require('express-yui/lib/patches/lang-bundles-requires'));

This will guarantee, that the language bundles denotated by file `lang/foo` and
`lang/bar` will be loaded. Of course, they will be loaded based on the transpiler
output, which generates a more complex module name. If you don't use this patch, you will
have to use the full name of the generated modules to require them manually in
the `requires` list.

@module express-yui/lib/patches/lang-bundles-requires
**/
module.exports = function patchLangBundlesRequires(Y, loader) {
    var getRequires = loader.getRequires;
    loader.getRequires = function (mod) {
        var i, j, m, name, mods, loadDefaultBundle,
            locales = Y.config.lang || [],
            r = getRequires.apply(this, arguments);
        // expanding requirements with optional requires
        if (mod.langBundles && !mod.langBundlesExpanded) {
            mod.langBundlesExpanded = [];
            locales = typeof locales === 'string' ? [locales] : locales.concat();
            for (i = 0; i < mod.langBundles.length; i += 1) {
                mods = [];
                loadDefaultBundle = false;
                name = mod.group + '-lang-' + mod.langBundles[i];
                for (j = 0; j < locales.length; j += 1) {
                    m = this.getModule(name + '_' + locales[j].toLowerCase());
                    if (m) {
                        mods.push(m);
                    } else {
                        // if one of the requested locales is missing,
                        // the default lang should be fetched
                        loadDefaultBundle = true;
                    }
                }
                if (!mods.length || loadDefaultBundle) {
                    // falling back to the default lang bundle when needed
                    m = this.getModule(name);
                    if (m) {
                        mods.push(m);
                    }
                }
                // adding requirements for each lang bundle
                // (duplications are not a problem since they will be deduped)
                for (j = 0; j < mods.length; j += 1) {
                    mod.langBundlesExpanded = mod.langBundlesExpanded.concat(this.getRequires(mods[j]), [mods[j].name]);
                }
            }
        }
        return mod.langBundlesExpanded && mod.langBundlesExpanded.length ?
                [].concat(mod.langBundlesExpanded, r) : r;
    };
};

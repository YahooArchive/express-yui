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
module.exports = function (Y) {
    var getRequires = Y.Env._loader.getRequires;
    Y.Env._loader.getRequires = function (mod) {
        var i, m, lang;
        if (!mod) {
            return [];
        }
        if (mod._parsed) {
            return mod.expanded || [];
        }
        mod.requires = mod.requires || [];
        // expanding requirements with lang bundles
        if (mod.langBundles) {
            lang = (Y.config.lang && Y.config.lang[0]) || Y.config.lang || 'en'; // TODO: nasty hack
            for (i = 0; i < mod.langBundles.length; i += 1) {
                m = this.getModule(mod.group + '-lang-' + mod.langBundles[i] + '_' + Y.config.lang);
                if (m) {
                    mod.requires.push(m.name);
                } else {
                    // trying to use the generic lang
                    m = this.getModule(mod.group + '-lang-' + mod.langBundles[i]);
                    if (m) {
                        mod.requires.push(m.name);
                    }
                }
            }
        }
        return getRequires.apply(this, arguments);
    };
};

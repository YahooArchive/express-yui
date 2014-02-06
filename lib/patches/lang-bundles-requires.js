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
        var i, len, m, name,
            lang = Y.config.lang,
            r = getRequires.apply(this, arguments);
        // expanding requirements with optional requires
        if (mod.langBundles) {
            len = mod.langBundles.length;
            // TODO: we are picking up the first lang for now, be we could do better
            lang = ((typeof lang === 'string' ? lang : lang[0]) || '').toLowerCase();
            for (i = 0; i < len; i += 1) {
                name = mod.group + '-lang-' + mod.langBundles[i];
                m = (lang && this.getModule(name + '_' + lang)) || this.getModule(name);
                if (m) {
                    r = [].concat(this.getRequires(m), [m.name], r);
                }
            }
        }
        return r;
    };
};

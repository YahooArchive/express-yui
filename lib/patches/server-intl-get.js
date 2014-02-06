/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Patches `Y.Intl.get` to use the language bundles produced by
`locator-lang` plugin, and will be available thru locator's bundle
objects on the server side. You can apply this patch like this:

    app.yui.patchServer(require('express-yui/lib/patches/server-intl-get'));

Then you can use this in your program:

    Y.Intl.get('<bundleName>/foo');

This will resolve `foo` as a language bundle from the bundle specified by name,
which is normally a file in `lang/foo.json` or `lang/foo.yrb`
that was transpiled into a module by `locator-lang`.

@module express-yui/lib/patches/server-intl-get
**/
module.exports = function patchIntlGet(Y, loader) {
    // monkey patching Y.Intl.get
    var originalInltGet = Y.use('intl').Intl.get,
        checked = {}; // internal hash for perf reasons since `loader.getModule()` might be expensive
    Y.Intl.get = function (name, key, lang) {
        var modName;
        if (lang) {
            // infering the name of the module from the lang bundle name
            modName = name.replace('/', '-lang-') + '_' + (typeof lang === 'string' ? lang : lang[0]);
            if (!checked[modName] && loader.getModule(modName)) {
                Y.use(modName); // useSync should be set
            }
            checked[modName] = true;
        }
        return originalInltGet.apply(this, arguments);
    };
};

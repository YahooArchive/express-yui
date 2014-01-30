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

    Y.Intl.get('foo');

This will resolve `foo` as a language bundle from the default locator
bundle, which is normally a file in `lang/foo.json` or `lang/foo.yrb`
that was transpiled into a module by `locator-lang`.

@module express-yui/lib/patches/server-intl-get
**/
module.exports = function patchIntlGet(Y, loader, app) {
    // monkey patching Y.Intl
    var locator = app.get('locator'),
        // looking in the root bundle (hermes has only one bundle)
        // that's the most common use-case where the app bundle holds all lang bundles
        rootBundle = locator.getRootBundle(),
        originalInltGet = Y.use('intl').Intl.get;
    Y.Intl.get = function (name, key, lang) {
        var pos = name.indexOf('/'),
            bundleName,
            bundle,
            langBundle = name;

        function output(entries) {
            // returning a specific key or all entries (todo: should be make a copy?)
            return (key ? entries[key] : entries);
        }

        if (pos > 0) {
            bundleName = name.slice(0, pos);
            langBundle = name.slice(pos + 1, name.length);
        }
        bundle = bundleName ? locator.getBundle(bundleName) : rootBundle;
        if (bundle.lang && bundle.lang[lang] && bundle.lang[lang][langBundle]) {
            return output(bundle.lang[lang][langBundle]);
        }
        // if the lang bundle is not in the specified bundle, look for a global/root lang bundle
        if (bundle !== rootBundle && rootBundle.lang && rootBundle.lang[lang] && rootBundle.lang[lang][name]) {
            return output(rootBundle.lang[lang][name]);
        }

        // fallbacking back to the original implementation
        return originalInltGet.apply(this, arguments);
    };
};

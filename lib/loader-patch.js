/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Provides hooks to patch the YUI loader on both the server and client.
@module express-yui/lib/yui-loader-patches
**/

'use strict';

module.exports = {

    /**
    Adds a list of clientside patches that will be applied to the YUI instance
    before the initial `use` statement.

    @method patchClient
    @public
    @param {Array} patches List of patches
    **/
    patchClient: function (patches) {
        if (patches) {
            this.config().patches = patches;
        }
    },

    /**
    Adds a list of serverside patches that will be applied to the YUI instance
    before the initial `use` statement.

    @method patchServer
    @public
    @param {Array} patches List of patches
    **/
    patchServer: function (patches) {
        if (patches) {
            this._patches = patches;
        }
    },

    // Potentially useful serverside patches
    server: {

        /**
        Patches `Y.Loader` to support `optionalRequires`, which enables you to
        require modules that might not be available in a runtime, and avoid to
        throw when that happens.

        @method patchLoader
        @param {Object} Y YUI instance
        **/
        patchLoader: function (Y) {
            var getRequires = Y.Env._loader.getRequires;
            Y.Env._loader.getRequires = function (mod) {
                var i, m;
                if (!mod) {
                    return [];
                }
                if (mod._parsed) {
                    return mod.expanded || [];
                }
                mod.requires = mod.requires || [];
                // expanding requirements with optional requires
                if (mod.optionalRequires) {
                    for (i = 0; i < mod.optionalRequires.length; i += 1) {
                        m = this.getModule(mod.optionalRequires[i]);
                        if (m) {
                            mod.requires.push(m.name);
                        }
                    }
                }
                // mod.templates and mod.langBundles are not used on the server side
                return getRequires.apply(this, arguments);
            };
        },

        /**
        Patches `Y.Template.get` to use the templates produced by
        `locator-handlebars` or any other similar plugin, and will be available
        thru locator's bundle objects.

        @method patchTemplate
        @param {Object} Y YUI instance
        **/
        patchTemplate: function (Y) {
            // monkey patching Y.Template
            var locator = this._app.get('locator'),
                // looking in the root bundle (hermes has only one bundle)
                // that's the most common use-case where the app bundle holds all templates
                rootBundle = locator.getRootBundle(),
                originalTemplateGet = Y.use('template-base').Template.get;

            Y.Template.get = function (name) {
                var pos = name.indexOf('/'),
                    bundleName,
                    bundle,
                    template = name;
                if (pos > 0) {
                    bundleName = name.slice(0, pos);
                    template = name.slice(pos + 1, name.length);
                }
                bundle = bundleName ? locator.getBundle(bundleName) : rootBundle;
                if (bundle.template && bundle.template[template]) {
                    return bundle.template[template];
                }
                // if the template is not in the specified bundle, look for a global/root template
                if (bundle !== rootBundle && rootBundle.template && rootBundle.template[name]) {
                    return rootBundle.template[name];
                }
                // falling back to the original implementation
                return originalTemplateGet.apply(this, arguments);
            };
        },

        /**
        Patches `Y.Intl.get` to use the language bundles produced by
        `locator-lang` plugin, and will be available thru locator's bundle
        objects.

        @method patchIntl
        @param {Object} Y YUI instance
        **/
        patchIntl: function (Y) {
            // monkey patching Y.Intl
            var locator = this._app.get('locator'),
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
        },

    },

    // Potentially useful clientside patches
    client: {

        /**
        Patches `Y.Loader` to support `optionalRequires`, which enables you to
        require modules that might not be available in a runtime, and avoid to
        throw when that happens.

        @method patchLoader
        @param {Object} Y YUI instance
        **/
        patchLoader: function (Y) {
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
                // expanding requirements with templates
                if (mod.templates) {
                    for (i = 0; i < mod.templates.length; i += 1) {
                        m = this.getModule(mod.group + '-template-' + mod.templates[i]);
                        if (m) {
                            mod.requires.push(m.name);
                        }
                    }
                }
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
                // expanding requirements with optional requires
                if (mod.optionalRequires) {
                    for (i = 0; i < mod.optionalRequires.length; i += 1) {
                        m = this.getModule(mod.optionalRequires[i]);
                        if (m) {
                            mod.requires.push(m.name);
                        }
                    }
                }
                return getRequires.apply(this, arguments);
            };
        }

    }

};

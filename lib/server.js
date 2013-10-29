/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `express-yui/lib/server` provides a set of features
to control a YUI instance on the server side.

@module express-yui/lib/server
**/

'use strict';

var libpath = require('path'),
    utils = require('./utils'),
    debug = require('debug')('express:yui:server');

/**
Provides a set of features to control a YUI instance on the server side.

@class server
@static
@uses *path, utils
@extensionfor express-yui/lib/yui
*/
module.exports = {

    /**
    Create a synthetic group off the bundle renference to register its modules
    into the server and/or client Y instance so they can be used thru `app.yui.use()`.

    @method registerBundle
    @public
    @param {Object} bundle A locator bundle reference.
    @chainable
    **/
    registerBundle: function (bundle) {
        var groups = {},
            modules;

        if (bundle.yui) {
            if (bundle.yui.client && bundle.yui.metaModuleName) {
                // storing client modules
                // - we don't own it, locator does it
                utils.extend(this._clientModules, utils.clone(bundle.yui.client) || {});
                // add the meta module into the core structure
                // to make sure it gets attached to Y upfront on the client side
                this.registerGroup(bundle.name, bundle.buildDirectory, bundle.yui.metaModuleName);
            }
            if (bundle.yui.server) {
                debug('Registering group "%s" for server side, and using it from "%s"',
                      bundle.name, bundle.buildDirectory);

                // provision modules for server side
                groups[bundle.name] = {
                    base: libpath.normalize(bundle.buildDirectory + '/'), // TODO: what if two modules have the same name but different affinity?
                    combine: false
                };
                // we don't own it, locator does it, and yui will potentially augment it
                modules = utils.clone(bundle.yui.server);
                // storing server modules
                // - we don't own it, locator does it
                utils.extend(this._serverModules, modules || {});
                // applying the new group config and modules globally and to the current Y instance when possible
                this.YUI.applyConfig({ groups: groups });
                this.YUI.applyConfig({ modules: modules });

                if (this._Y) {
                    this._Y.applyConfig({ groups: groups });
                    this._Y.applyConfig({ modules: modules });
                }
            }
        }

        return this;
    },

    /**
    Patches `Y.Loader` to support `optionalRequires`, which enables you
    to require modules that might not be available in a runtime, and avoid
    to throw when that happens.

    @method _patchLoader
    @protected
    **/
    _patchLoader: function () {
        var getRequires = this._Y.Env._loader.getRequires;
        this._Y.Env._loader.getRequires = function (mod) {
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
    `locator-handlebars` or any other similar plugin, and will be available thru locator's bundle
    objects.

    @method _patchTemplate
    @protected
    **/
    _patchTemplate: function () {
        // monkey patching Y.Template
        var locator = this._app.get('locator'),
            // looking in the root bundle (hermes has only one bundle)
            // that's the most common use-case where the app bundle holds all templates
            rootBundle = locator.getRootBundle(),
            originalTemplateGet = this._Y.use('template-base').Template.get;

        this._Y.Template.get = function (name) {
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

    @method _patchIntl
    @protected
    **/
    _patchIntl: function () {
        // monkey patching Y.Intl
        var locator = this._app.get('locator'),
            // looking in the root bundle (hermes has only one bundle)
            // that's the most common use-case where the app bundle holds all lang bundles
            rootBundle = locator.getRootBundle(),
            originalInltGet = this._Y.use('intl').Intl.get,
            intl = this._Y.Intl;

        intl.get = function (name, key, lang) {
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
            if (bundle && bundle.lang) {
                // resolving the best lang if needed
                lang = bundle.lang[lang] ? lang : intl.lookupBestLang(lang, Object.keys(bundle.lang));
                if (bundle.lang[lang][langBundle]) {
                    return output(bundle.lang[lang][langBundle]);
                }
            }
            // if the lang bundle is not in the specified bundle, look for a global/root lang bundle
            if (bundle !== rootBundle && rootBundle && rootBundle.lang) {
                // resolving the best lang if needed
                lang = rootBundle.lang[lang] ? lang : intl.lookupBestLang(lang, Object.keys(rootBundle.lang));
                if (rootBundle.lang[lang] && rootBundle.lang[lang][name]) {
                    return output(rootBundle.lang[lang][name]);
                }
            }

            // fallbacking back to the original implementation
            return originalInltGet.apply(this, arguments);
        };
    },

    /**
    Waits for the app to be ready, including the YUI instance to notify back that the
    `ready` state of the app was reached by calling the `callback`. The ready state is
    bound to the locator instance mounted into the express app thru `app.set('locator', locator);`
    and depending on `app.get('locator').ready.then()` promise result, the ready state
    will be reached or not.

        app.yui.ready(function (err) {
            if (err) {
                throw err;
            }
            // do something!
        });

    @method ready
    @param {Function} callback when the app is ready. If an error occurr, the error object
                        will be passed as the first argument of the callback function.
    @public
    **/
    ready: function (callback) {
        var self = this,
            app = this._app,
            locator = app.get('locator');

        if (!locator) {
            debug('Call `app.set("locator", locatorObj)` before extending the `express` app with `express-yui`');
            throw new Error('Locator instance should be mounted');
        }

        locator.ready.then(function () {
            var bundleNames = locator.listBundleNames(),
                bundle;

            try {
                bundleNames.forEach(function (bundleName) {
                    bundle = locator.getBundle(bundleName);
                    self.registerBundle(bundle);
                });
            } catch (e) {
                callback(e);
                return;
            }
            // we are now ready to receive traffic
            callback();
        }, callback);
    },

    /**
    Creates a YUI Instance, and wraps the call to `Y.use()` to work appropiatly on
    the server side. The `use` method can be called once the `ready` state is achieved
    thru `app.yui.ready()`.

        app.yui.ready(function (err) {
            if (err) {
                throw err;
            }
            app.yui.use('json-stringify', function (Y) {
                Y.JSON.stringify({ entry: 'value' });
            });
        });

    @method use
    @public
    @return {Object} Y instance
    **/
    use: function () {
        var config = this.config(),
            Y = this._Y,
            modules,
            callback;

        if (!Y) {
            config = utils.clone(config);
            // cleaning up the config for to add on the server specific config
            delete config.modules;
            delete config.groups;

            this.YUI.applyConfig(config);
            this.YUI.applyConfig({
                base: libpath.normalize(this.path + '/'),
                combine: false
            });
            Y = this._Y = this.YUI({
                useSync: true,
                loadErrorFn: function (Y, i, o) {
                    debug('--> Something really bad happened when trying to load yui modules on the server side');
                    debug('--> ' + o.msg);
                    if (Y.config.modules) {
                        debug('--> Y.config.modules = ' + JSON.stringify(Y.config.modules));
                    }
                    if (Y.config.groups) {
                        debug('--> Y.config.groups = ' + JSON.stringify(Y.config.groups));
                    }
                }
            });
            // patching Y
            this._patchLoader();
            this._patchTemplate();
            this._patchIntl();
        }

        // attaching modules
        // in case a callback is passed, we should consider that
        modules = Array.prototype.slice.call(arguments, 0);
        if (modules.length > 0 && (typeof modules[modules.length - 1] === 'function')) {
            callback = modules.pop();
        }
        if (modules.length) {
            try {
                Y.use(modules);
            } catch (e) {
                console.error('error attaching modules: ' + modules);
                console.error(e);
                console.error(e.stack);
            }
        }

        if (callback) {
            callback(Y);
        }

        return Y;

    }

};

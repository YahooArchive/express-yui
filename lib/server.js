/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `express-yui.server` extension that provides a set of features
to control a YUI instance on the server side.

@module yui
@submodule server
**/

'use strict';

var libpath = require('path'),
    utils = require('./utils'),
    debug = require('debug')('express:yui:server');

/**
The `express-yui.server` extension that provides a set of features
to control a YUI instance on the server side.

@class server
@static
@uses *path, utils
@extensionfor yui
*/
module.exports = {

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
    Create a synthetic group off the bundle renference to register its modules
    into the server Y instance so they can be used thru `app.yui.use()`.

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
                // add the meta module into the core structure
                // to make sure it gets attached to Y upfront on the client side
                this.registerGroup(bundle.name, bundle.buildDirectory, bundle.yui.metaModuleName);
                // storing client modules
                // - we don't own it, locator does it
                utils.extend(this._clientModules, utils.clone(bundle.yui.client) || {});
            }
            if (bundle.yui.server) {
                debug('Registering group "%s" for server side, and using it from "%s"',
                      bundle.name, bundle.buildDirectory);

                // provision modules for server side
                groups[bundle.name] = {
                    base: bundle.buildDirectory, // TODO: what if two modules have the same name but different affinity?
                    combine: false
                };
                // we don't own it, locator does it, and yui will potentially augment it
                modules = utils.clone(bundle.yui.server);
                // storing server modules
                // - we don't own it, locator does it
                utils.extend(this._clientModules, modules || {});
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
    Creates a YUI Instance and attaches all registered modules for all registered
    groups into it, and optional attaches some more modules my mimicing the original
    YUI.use method.

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

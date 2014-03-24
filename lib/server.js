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
            modules,
            key;

        if (bundle.yui) {
            if (bundle.yui.client && bundle.yui.metaModuleName) {
                // storing client modules
                // - we don't own it, locator does it
                for (key in bundle.yui.client) {
                    if (bundle.yui.client.hasOwnProperty(key)) {
                        if (this._clientModules.hasOwnProperty(key) && this._clientModules[key].group !== bundle.yui.client[key].group) {
                            debug("Module name collision on the client: '%s' is used for both group '%s' and group '%s'",
                                key, this._clientModules[key].group, bundle.yui.client[key].group);
                        }
                        this._clientModules[key] = utils.clone(bundle.yui.client[key]);
                    }
                }
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

                for (key in modules) {
                    if (modules.hasOwnProperty(key)) {
                        if (this._serverModules.hasOwnProperty(key) && this._serverModules[key].group !== modules[key].group) {
                            debug("Module name collision on the server: '%s' is used for both group '%s' and group '%s'",
                                key, this._serverModules[key].group, modules[key].group);
                        }
                        this._serverModules[key] = modules[key];
                    }
                }

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

        // there is a possibility that callback fails, so we trick it to
        // outsource the execution of it to avoid calling it twice
        function end() {
            setTimeout.apply(null, [callback, 0].concat(Array.prototype.slice.apply(arguments)));
        }

        locator.ready.then(function () {
            var bundleNames = locator.listBundleNames(),
                bundle;

            bundleNames.forEach(function (bundleName) {
                bundle = locator.getBundle(bundleName);
                self.registerBundle(bundle);
            });

            end();

        })["catch"](end);
    },

    /**
    Creates a YUI Instance, and wraps the call to `Y.require()` to work appropiatly on
    the server side. The `require` method can be called once the `ready` state is achieved
    thru `app.yui.ready()`.

        app.yui.ready(function (err) {
            if (err) {
                throw err;
            }
            app.yui.require('json-stringify', function (Y, imports) {
                Y.JSON.stringify({ entry: 'value' });
            });
        });

    @method require
    @public
    **/
    require: function () {
        var config = this.config(),
            Y = this._Y,
            modules,
            callback,
            imports;

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

            // patching serverside Y
            if (this._patches && this._patches.length) {
                this._patches.forEach(function (patch) {
                    patch(Y, Y.Env._loader);
                }, this);
            }
        }

        // attaching modules
        // in case a callback is passed, we should consider that
        modules = Array.prototype.slice.call(arguments, 0);
        if (modules.length > 0 && (typeof modules[modules.length - 1] === 'function')) {
            callback = modules.pop();
        }
        if (modules.length) {
            try {
                Y.require(modules, function (Y, __imports__) {
                    // capture imports in outer scope
                    imports = __imports__;
                });
            } catch (e) {
                console.error('error attaching modules: ' + modules);
                console.error(e);
                console.error(e.stack);
            }
        }

        if (callback) {
            // support `use()` or `require()` callback signature
            if (imports) {
                callback(Y, imports);
            } else {
                callback(Y);
            }
        }

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
        this.require.apply(this, arguments);
        return this._Y;
    }

};

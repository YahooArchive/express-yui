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
    groups = {};

/**
The `express-yui.server` extension that provides a set of features
to control a YUI instance on the server side.

@class server
@static
@uses *path, utils
@extensionfor yui
*/
module.exports = {

    /**
    Provisions a group and its modules to be attached into Y instance when needed or
    updates the current Y instance by re-attaching the updated group.

    @method attachModules
    @protected
    @param {string} groupName The bundle/group name to be attached.
    @param {array} groupModules The list of modules for the group.
    @chainable
    **/
    attachModules: function (groupName, groupModules) {
        var YUIEnv = this.YUI && this.YUI.Env,
            version = this.version,
            YEnv = this._Y && this._Y.Env,
            module;

        groups[groupName] = {
            modules: groupModules
        };

        if (YEnv && YUIEnv) {
            for (module in groupModules) {
                if (groupModules.hasOwnProperty(module)) {
                    // if the module was attached already, we should clean up the loader internal hashes
                    if (YEnv._attached && YEnv._attached[module]) {
                        // instance entries
                        delete YEnv._attached[module];
                        delete YEnv._used[module];
                        delete YEnv._loader.loaded[module];
                        delete YEnv._loader.inserted[module];
                        delete YEnv._loader.required[module];
                        // global entries
                        delete YUIEnv._loaded[version][module];
                        delete YUIEnv.mods[module];
                        // TODO: can we optimize this? delete is evil
                    }
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
    @protected
    @return {Object} Y instance
    **/
    use: function () {
        var config = this.config(),
            Y = this._Y,
            groupName,
            obj,
            modules,
            callback;

        modules = Array.prototype.slice.call(arguments, 0);

        // in case a callback is passed
        if (modules.length > 0 && (typeof modules[modules.length - 1] === 'function')) {
            callback = modules.pop();
        }

        for (groupName in groups) {
            if (groups.hasOwnProperty(groupName) && (config.groups && config.groups.hasOwnProperty(groupName))) {
                obj = { groups: {}, useSync: true };
                obj.groups[groupName] = utils.extend(groups[groupName], utils.clone(config.groups[groupName]), {
                    base: libpath.join(this._groupFolderMap[groupName], '/'),
                    combine: false
                });
                modules = modules.concat(Object.keys(groups[groupName].modules || {}));
            }
        }

        if (!Y) {
            config = utils.clone(config);
            config.groups = {}; // disabling the groups that will be added later on
            // TODO: control loading issues
            Y = this._Y = this.YUI(config, {
                base: libpath.normalize(this.path + '/'),
                combine: false,
                useSync: true
            }, obj);
        } else if (obj) {
            Y.applyConfig(obj);
        }

        if (modules.length) {
            try {
                Y.use(modules);
            } catch (e) {
                console.error('error attaching modules: ' + modules);
                console.error(e);
                console.error(e.stack);
            } finally {
                groups = {}; // reseting the queue
            }
        }

        if (callback) {
            callback(Y);
        }

        return Y;

    }

};

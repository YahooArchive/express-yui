/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.groups` extension provides a set of features
to expose YUI groups to the client so that the loader has the
correct configuration to load required modules.

@module yui
@submodule groups
**/

'use strict';

var libfs      = require('fs'),
    libpath    = require('path'),
    libvm      = require('vm'),
    utils      = require('./utils'),
    contextForRunInContext; // module scoped for reuse

contextForRunInContext = libvm.createContext({
    require: require,
    module: require('module'),
    console: {
        log: function () {}
    },
    window: {},
    document: {},
    YUI: null
});

/**
The `yui.origin` extension that provides some basic configuration
that will facilitate the configuration of YUI Core modules and other
groups to be served from the express app in a form of origin server.


TODO: Docs

@class groups
@static
@uses utils, static
@extension for yui
*/
module.exports = {


    /**

    var config = yui.groups.getGroupConfig(path);

    config.moduleName = "metas"; // name of the meta module
    config.moduleVersion = "0.0.1"; // version matching the meta module
    config.requires = [ ]; // list of requires for the meta module
    config.groupNname = "app"; // the first group name in the configuration
    config.modules = { }; // the module configuration for the group

    @method getGroupConfig
    @public
    @param {String} path The path to the module JS source
    @return {Object}
    **/
    getGroupConfig: function (path) {
        var res;

        // TODO: handle invalid path
        res = this._captureYUIModuleDetails(path);

        // return res.yui;
        return {
            groupName: res.yui.groups.name,
            modules: res.yui.groups.modules,
            moduleName: res.yui.name,
            moduleVersion: res.yui.version,
            requires: res.yui.meta.requires
        };
    },

    /**
    Given a path to a meta YUI module, parse the module name and
    specific group app module configuration.

    @method _captureYUIModuleDetails
    @private
    @param {String} res.path absolute path to the meta module
    @return {Object} configuration with meta details
    **/
    _captureYUIModuleDetails: function (path) {
        var file,
            sandbox,
            yui = {},
            key,
            groupName,
            modules,
            res = { yui: { } };

        file = libfs.readFileSync(path, 'utf8');

        sandbox = {
            config: { },
            modown: { }, // namespace it
            Intl: {
                add: function (langFor, lang) {
                    res.yui.langFor = langFor;
                    res.yui.lang = lang;
                }
            },
            merge: function (to, from) {
                return utils.extend(to, from);
            },
            applyConfig: function (config) {
                var groups;

                groups = config.groups;
                if (groups && Object.keys(groups).length > 1) {
                    if (this.modown.groups) {
                        // NOTE: only one group configuration per file
                        console.error('Groups metadata should only contain ' +
                                      'at most 1 group per file. Only the ' +
                                      'first one will be used.');
                    }
                }

                this.modown.groups = groups;
            }
        };
        contextForRunInContext.YUI = {
            ENV: {},
            config: {},
            use: function () {},
            add: function (name, fn, version, meta) {
                yui.name = name;
                yui.version = version;
                yui.meta = meta || {};
                if (!yui.meta.requires) {
                    yui.meta.requires = [];
                }
                if (sandbox) {
                    try {
                        fn(sandbox, yui.name);
                    } catch (e) {
                        console.error('failed to run js file ' + res.path);
                        console.error('error: ' + e.message);
                    }
                }
            }
        };
        try {
            libvm.runInContext(file, contextForRunInContext, res.path);
        } catch (e) {
            yui = null;
            console.error('failed to parse js file ' + res.path);
            console.error('error: ' + e.message);
        }
        if (yui) {
            // merge the module meta
            res.yui = utils.extend(res.yui || {}, yui);
            // name, version, meta.requires

            // merge the groups app config
            if (sandbox.modown.groups) {
                for (key in sandbox.modown.groups) {
                    if (sandbox.modown.groups.hasOwnProperty(key)) {
                        groupName = key;
                        modules = sandbox.modown.groups[key].modules || {};
                        break; // only pick the 1st group name
                    }
                }
                res.yui.groups = {
                    name: groupName,
                    modules: modules
                };
            }
        }
        return res;
    }

};

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

TODO: Docs

@class groups
@static
@uses utils, static
@extension for yui
*/
module.exports = {


    /**
     * var path,
     *     config;
     * path = __dirname + '/assets/js/metas.js';
     * config = yui.groups.getGroupConfig(path);
     *
     * The output has the following specification.
     *
     * config.moduleName = "metas"; // name of the meta module
     * config.moduleVersion = "0.0.1"; // version matching the meta module
     * config.requires = [ ]; // list of requires for the meta module
     * config.groupNname = "app"; // the first group name in the configuration
     * config.modules = { }; // the module configuration for the group
     *
     * @method getGroupConfig
     * @public
     * @param {String} path The path to the module JS source
     * @return {Object}
     */
    getGroupConfig: function (path) {
        var out,
            yui,
            group,
            groupName = '',
            modules = { };

        // TODO: handle invalid path
        out = this._captureYUIModuleDetails(path);
        yui = out.yui || {};

        if (yui.groups) {
            // currently only support 1 group per meta, so pick the first one
            if (Object.keys(yui.groups).length > 1) {
                console.error('Groups metadata should only contain ' +
                              'at most 1 group per file. Only the ' +
                              'first one will be used.');
            }
            for (group in yui.groups) {
                if (yui.groups.hasOwnProperty(group)) {
                    groupName = group;
                    modules = yui.groups[group].modules || {};
                    break;
                }
            }
        }

        return {
            moduleName: yui.name,
            moduleVersion: yui.version,
            requires: (yui.meta && yui.meta.requires) || [],
            // group meta
            groupName: groupName,
            modules: modules
        };
    },

    /**
     * creates a new sandbox instance in which to run the YUI module.
     *
     * default sandbox supports
     * <ul>
     *   <li>Y.config</li>
     *   <li>Y.applyConfig</li>
     *   <li>Y.merge</li>
     * </ul>
     *
     * @method _createSandbox
     * @private
     * @return {Object} 
     */
    _createSandbox: function () {
        var sandbox;

        sandbox = {
            config: { },
            modown: { }, // namespace it
            Intl: {
                add: function (langFor, lang) {
                    sandbox.modown.yui = {
                        langFor: langFor,
                        lang: lang
                    };
                }
            },
            merge: function (to, from) {
                return utils.extend(to, from);
            },
            applyConfig: function (config) {
                this.modown.groups = config.groups || {};
            }
        };

        return sandbox;
    },

    /**
     * Given a path to a meta YUI module, parse the module name and
     * specific group app module configuration.
     *
     * @method _captureYUIModuleDetails
     * @private
     * @param {String} path absolute path to the meta module
     * @param {Object} sandbox a sandbox instance in which to run the YUI
     *                         module. if not provided, a default one will
     *                         be used.
     * @return {Object} configuration with meta details
     */
    _captureYUIModuleDetails: function (path, sandbox) {
        var file,
            yui = {},
            key,
            groupName,
            modules,
            res = { yui: { } };

        sandbox = sandbox || this._createSandbox();
        file = libfs.readFileSync(path, 'utf8');

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
                        // Fail silently. When dealing with lots of files,
                        // these errors is not that useful as this module is
                        // only interested in collecting the YUI module meta
                        // data.
                        // console.error('failed to run js file ' + path);
                        // console.error('error: ' + e.message);
                    }
                }
            }
        };
        try {
            libvm.runInContext(file, contextForRunInContext, path);
        } catch (e) {
            yui = null;
            console.error('failed to parse js file ' + path);
            console.error('error: ' + e.message);
        }
        if (yui) {
            // name, version, meta.requires
            res.yui = utils.extend(res.yui || {}, yui);

            if (sandbox.modown.groups) {
                res.yui.groups = sandbox.modown.groups;
            }
        }
        return res;
    }

};

/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.groups` extension provides a set of utilities
analyze meta modules and group metada.

@module yui
@submodule groups
**/

'use strict';

var libfs      = require('fs'),
    libvm      = require('vm'),
    utils      = require('./utils'),
    // module scoped for reuse
    contextForRunInContext = libvm.createContext({
        require: null,
        module: null,
        console: {
            log: function () {}
        },
        window: {},
        document: {},
        YUI: null
    });

/**

The `yui.groups` extension provides a set of utilities
analyze meta modules and group metada.

@class groups
@static
@uses utils, *fs, *path, *vm
@extension for yui
*/
module.exports = {

    /**
    Extracts information from a meta module. This information includes
    the details about the meta module in the YUI registry plus all the
    info about the groups that are part of the meta module, along with
    all the modules per group. This method is used by `origin` to
    analyze each group before serving them.

        var path,
            config;
        path = __dirname + '/assets/js/metas.js';
        config = app.yui.groups.getGroupConfig(path);

    @method getGroupConfig
    @protected
    @param {String} path the filesystem path to the meta module
    @return {Object} the information extracted from the meta module

        @return {String} moduleName the name used to register the meta module
        @return {String} moduleVersion the version number used to register the meta module
        @return {Object} moduleConfig the configuration (requires, use, etc.) used to register
            the meta module
        @return {String} groupNname the first group name in the configuration
        @return {Object} modules the modules meta for the group

    **/
    getGroupConfig: function (path) {
        var yui,
            group,
            groupName = '',
            modules = { };

        // TODO: handle invalid path
        yui = this._captureYUIModuleDetails(path) || {};

        // TODO: supports multiple groups

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
            moduleConfig: yui.config || {},
            // group meta
            groupName: groupName,
            modules: modules
        };
    },

    /**
    Creates a new sandbox instance in which to run the YUI module.

    Default sandbox supports:
    <ul>
      <li>Y.config</li>
      <li>Y.applyConfig</li>
      <li>Y.mix</li>
      <li>Y.merge</li>
      <li>Y.version</li>
    </ul>

    @method _createSandbox
    @private
    @return {Object} the mock to extract the metas from the meta module
    **/
    _createSandbox: function () {
        var sandbox;

        sandbox = {
            version: 'sandbox',
            config: {},
            merge: function (to, from) {
                return utils.extend(to, from);
            },
            mix: function (to, from) {
                return utils.extend(to, from);
            },
            applyConfig: function (config) {
                this.groups = config.groups || {};
            }
        };

        return sandbox;
    },

    /**
    Given a path to a meta YUI module, parse the module name and
    specific group app module configuration.

    @method _captureYUIModuleDetails
    @private
    @param {String} path absolute path to the meta module
    @param {Object} sandbox a sandbox instance in which to run the YUI
                            module. if not provided, a default one will
                            be used.
    @return {Object} configuration with meta details
    **/
    _captureYUIModuleDetails: function (path, sandbox) {
        var file,
            yui = {};

        sandbox = sandbox || this._createSandbox();
        // TODO: make this async and remove the stupid flag
        file = libfs.readFileSync(path, 'utf8');

        contextForRunInContext.YUI = {
            Env: {
                sandbox: sandbox
            },
            config: {},
            use: function () {},
            add: function (name, fn, version, config) {
                yui.name = name;
                yui.version = version;
                yui.config = config;
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
            console.error('failed to parse js file ' + path);
            console.error('error: ' + e.message);
            return;
        }
        // yui comes from YUI.add mock, and here we complete it
        // with `groups` member.
        if (sandbox.groups) {
            /**
            Y.applyConfig({
                groups: {
                    app: Y.merge((Y.config.groups && Y.config.groups.app) || {}, {
                        modules: { @modules@ }
                    })
                }
            });
            **/
            yui.groups = sandbox.groups;
        } else if (sandbox.modules) {
            /**
            Support for:
            YUI.Env[Y.version].modules = YUI.Env[Y.version].modules || {};
            Y.mix(YUI.Env[Y.version].modules, { @modules@ };
            **/
            yui.groups = yui.groups || {};
            yui.groups[sandbox.modules[Object.keys(sandbox.modules)[0]].group] = {
                modules: sandbox.modules
            };
        }
        return yui;
    }

};

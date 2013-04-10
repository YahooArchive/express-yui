/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.server` extension that provides a set of features
to control a YUI instance on the server side.

@module yui
@submodule server
**/

'use strict';

var libpath = require('path'),
    utils = require('./utils'),
    Y,
    groups = {};

/**
The `yui.server` extension that provides a set of features
to control a YUI instance on the server side.

@class server
@static
@uses utils, static
@extensionfor yui
*/
module.exports = {

    attachModules: function (groupName, groupModules) {
        if (!Y) {
            groups[groupName] = {
                modules: groupModules
            };
        }

        // TODO: else
        // 1. clear the Env to re-attach the updated modules
        // 2. reset group config
        // 3. Y.use(modules);
    },

    getYInstance: function () {
        var config = this.config(),
            groupName,
            modules = [],
            obj;

        for (groupName in groups) {
            if (groups.hasOwnProperty(groupName)) {
                obj = { groups: {}, useSync: true };
                // TODO: validation
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
            Y = this.YUI(config, {
                base: libpath.normalize(this.path + '/'),
                combine: false,
                useSync: true
            }, obj);
        } else {
            Y.applyConfig(obj);
        }

        console.log('attaching modules: ' + Object.keys(groups[groupName].modules || {}));
        // TODO: control loading issues
        Y.use(modules);
        groups = {}; // reseting the queue

        return Y;

    }

};

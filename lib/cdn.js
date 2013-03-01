/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils = require('./utils');

module.exports = {

    serveCoreFromCDN: function (loaderConfig) {

        var version = this.version;

        this.config({
            base: "http://yui.yahooapis.com/" + version + "/",
            comboBase: "http://yui.yahooapis.com/combo?",
            root: version + "/"
        }, loaderConfig);

        return false;

    },

    serveGroupFromCDN: function (groupName, loaderConfig) {

        var config = this.config();

        config.groups = config.groups || {};
        config.groups[groupName] = config.groups[groupName] || {};
        utils.extend(config.groups[groupName], {
            combine: config.combine
        }, loaderConfig);

        return false;

    }

};
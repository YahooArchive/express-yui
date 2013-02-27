/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils = require('./utils');

module.exports = {

    serveCoreFromCDN: function (cdnConfig) {

        var version = this.version;

        this.config({
            base: "http://yui.yahooapis.com/" + version + "/",
            comboBase: "http://yui.yahooapis.com/combo?",
            root: version + "/"
        }, cdnConfig);

        return false;

    },

    serveAppFromCDN: function (cdnConfig) {

        var config = this.config();

        config.groups = config.groups || {};
        config.groups.app = config.groups.app || {};
        utils.extend(config.groups.app, {
            combine: !!config.combine
        }, cdnConfig);

        return false;

    }

};
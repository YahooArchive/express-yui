/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils   = require('./utils'),
    combo   = require('combohandler'),
    express = require('express');

module.exports = {

    /**
     * Serves YUI modules from the same origin as to where the application is
     * hosted
     *
     * @param {Object} config
     * @param {Object} app express app
     */
    serveYUIFromAppOrigin: function (config, app) {

        var yuiPrefix = "/static/yui/";

        // this routine requires an express app, and it
        // always fallback to `yui.app`.
        app = app || this.app;

        // it case the default local config should be overruled
        config = this.config({
            maxURLLength: 1024,
            base: yuiPrefix,
            comboBase: "/combo?",
            comboSep: "&",
            root: ""
        }, config);


        if (!app || !this.path) {
            throw new Error('Unable to serve YUI Core modules. ' +
                'Make sure you call yui.plug(app) or the `app` argument ' +
                'to gain access to the express app.');
        }

        // regular requests
        app.use(config.base,
                express['static'](this.path));
        // combined requests
        app.get(config.comboBase, combo.combine({
            rootPath: this.path
        }), function (req, res) {
            res.send(res.body);
        });

        return false;

    }

};

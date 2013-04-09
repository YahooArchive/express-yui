/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

'use strict';

var utils = require('./utils');

// -- Constructor --------------------------------------------------------------

function ExpressEngine(config, Y) {
    config = config || {};

    this.defaultLayout = config.defaultLayout;
    this.defaultBundle = config.defaultBundle;
    this.helpers       = config.helpers;
    this.Y             = Y;
    this.engine = this.renderView.bind(this);
}

// -- Prototype ----------------------------------------------------------------

ExpressEngine.prototype = {

    // -- Public Methods -------------------------------------------------------

    render: function (templateName, options, callback) {
        options = options || {};

        templateName = 'foo';

        var helpers = utils.extend({}, this.helpers, options.helpers),
            template = this._getTemplate(templateName, options);

        if (!template) {
            callback(new Error('Invalid template: ' + templateName));
            return;
        }

        try {
            callback(null, template(options, {
                helpers : helpers
            }));
        } catch (e) {
            callback(e);
        }
    },

    renderView: function (templateName, options, callback) {
        if (typeof options === 'function') {
            callback = options;
            options  = {};
        }

        options = options || {};

        var layoutName = options.hasOwnProperty('layout') ? options.layout : this.defaultLayout;

        this.render(templateName, options, function (err, body) {

            if (err) {
                callback(err);
                return;
            }

            if (!layoutName) {
                callback(null, body);
                return;
            }

            this.render(layoutName, utils.extend({}, options, {body: body}), callback);

        });
    },

    // -- Private Methods ------------------------------------------------------

    _getTemplate: function (templateName, options) {
        var bundleName = options.hasOwnProperty('bundle') ? options.bundle :
                this.defaultBundle;

        return bundleName && this.Y && this.Y[bundleName] && this.Y[bundleName].templates &&
            this.Y[bundleName].templates[templateName];
    }

};

// -- Exports ------------------------------------------------------------------

module.exports = {

    engine: function (config) {

        return new ExpressEngine(config, this.getYInstance()).engine;

    }

};
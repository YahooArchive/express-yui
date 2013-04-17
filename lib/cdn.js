/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.cdn` extension that provides some basic configuration
that will facilitate the configuration of YUI to be served from
CDN as well as custom groups to be configured to be served from
and alternative CDN as well.

@module yui
@submodule cdn
**/

'use strict';

var utils = require('./utils');

/**
The `yui.cdn` extension that provides some basic configuration
that will facilitate the configuration of YUI to be served from
CDN as well as custom groups to be configured to be served from
and alternative CDN as well.

When the `"cdn"` sub-module is used by `yui` middleware, it
will allow you to explicitly ask for booting YUI from YUI CDN
in the client runtime. You can also do the same for any custom
group. In the following example you can see how to configure
group `mycompany` to be served from a custom CDN.

    // Creates a new express app.
    var app = express();

    // Initialize yui middleware
    yui({});

    app.use(yui.serveCoreFromCDN());

    app.use(yui.serveGroupFromCDN('mycompany', {
        base: "http://mycompany.com/mymodules/",
        comboBase: "http://mycompany.com/combo~",
        root: "mymodules/",
        modules: {
            foo: {
                path: "foo.js"
            }
        }
    }));

@class cdn
@static
@uses utils
@extensionfor yui
*/
module.exports = {

    /**
    Set up a default group in loader that represents the
    core yui modules to be loaded from YUI CDN.

        app.use(yui.serveCoreFromCDN());

    @method serveCoreFromCDN
    @public
    @param {Object} loaderConfig Optional loader configuration
    objects that, if passed, will be mix with the default
    configuration for yui CDN.
    @return {function} express middleware
    **/
    serveCoreFromCDN: function (loaderConfig) {

        var version = this.version;

        this.config({
            base: "http://yui.yahooapis.com/" + version + "/",
            comboBase: "http://yui.yahooapis.com/combo?",
            comboSep: "&",
            root: version + "/"
        }, loaderConfig);

        return false;

    },

    /**
    Set up a new group in loader to be loaded from a
    custom CDN.

        app.use(yui.serveGroupFromCDN('mycompany', {
            base: "http://mycompany.com/mymodules/",
            combine: false
        }));

    @method serveGroupFromCDN
    @public
    @param {String} groupName Identifier for the group
    @param {Object} loaderConfig custom configuration for yui loader
        @param {Object} loaderConfig.modules collection of modules with
                         the respective relative path per module.
        @param {String} loaderConfig.base the full path to the group.
    @return {Function} express middleware
    **/
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

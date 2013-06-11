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
CDN.

When the `"cdn"` sub-module is used by `yui` middleware, it
will allow you to explicitly ask for booting YUI from YUI CDN
in the client runtime. In the following example you can see how
to force yui to load from CDN. This is the default behavior, but
in some cases, when defining a custom base and root for all groups
you might want to set YUI straight to the original YUI CDN.

    // Creates a new express app.
    var app = express();
    app.yui.setCoreFromCDN();

@class cdn
@static
@uses utils
@extensionfor yui
*/
module.exports = {

    /**
    Set up a default group in loader that represents the
    core yui modules to be loaded from YUI CDN.

        app.yui.setCoreFromCDN();

    @method setCoreFromCDN
    @public
    @param {Object} loaderConfig Optional loader configuration
    objects that, if passed, will be mix with the default
    configuration for yui CDN.
    @chainable
    **/
    setCoreFromCDN: function (loaderConfig) {

        var config = this.config(),
            version = this.version;

        utils.extend(config, {
            base: "http://yui.yahooapis.com/" + version + "/",
            comboBase: "http://yui.yahooapis.com/combo?",
            comboSep: "&",
            root: version + "/"
        }, loaderConfig);

        return this;

    }

};

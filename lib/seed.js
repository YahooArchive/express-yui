/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
`yui.seed` extension that provides a set of features
to construct the yui seed blob which contains the url
to fetch the initial piece of the library before
calling `YUI().use()` in the client runtime.

@module yui
@submodule seed
**/

'use strict';

var utils = require('./utils');

/**
`yui.seed` extension that provides a set of features
to configure and construct the yui seed blob which
contains the url to be used to fetch the initial piece
of the yui library, plus any app specific meta and modules
before calling `YUI().use()` in the client runtime.

When the `"seed"` sub-module is used, it will automatically
mix itself into `yui.expose()`, and it exposes a local variable
in a form of an HTML fragment with the script tag or tags
that forms the seed:

The following is an example of how these features can be used:

    // Creates a new express app.
    var app = express();

    // Initialize yui middleware
    yui({}, 'path/to/yui/folder');

    // adjust the seed modules
    app.use(yui.seed(['yui-base', 'loader-base', 'loader-yui3']));

    // Call expose middleware when a route match.
    app.get('/index.html', yui.expose(), anotherRoute);

In the example above, the blob with the script tags will
be exposed thru `res.locals.yui_seed`, which means you
can use it in your templates right before calling
`YUI().use()` in your pages.

@class yui.seed
@static
@uses utils
@extensionfor yui
*/
module.exports = {

    /**
    Specify a list of modules to use as seed. This
    method extends the yui static configuration,
    specifically setting the `yui.config().seed` value.

    @method seed
    @param {Array} modules list of modules to use
    @return {function} express middleware
    **/
    seed: function (modules) {

        var config = this.config({
            seed: modules
        });

        return false;

    },

    /**
    Expand the list of seed modules and expose
    the seeds to the client. Usually, `yui.expose()`
    will take care of calling `seed.exposeSeed()`,
    although you can use this method directly.

    @method exposeSeed
    @return {function} express middleware
    **/
    exposeSeed: function () {

        // getting static config
        var config = this.config(),
            seedCache = '',
            modules = [].concat(config.seed || ['yui-base']),
            appModules = utils.clone(((config.groups && config.groups.app && config.groups.app.modules) || {})),
            mod,
            i,
            Y,
            loader;

        Y = this.YUI({sync: true, modules: appModules}).use('loader-base');

        // TODO: add config so that module expansion can be disabled if needed
        // expand modules
        loader = new Y.Loader({
            base: config.base,
            ignoreRegistered: true,
            require : modules
        });
        loader.calculate();
        modules = [].concat(loader.sorted);
        loader = null;
        Y = null;

        // producing blob with the html fragment
        for (i = 0; i < modules.length; i += 1) {
            seedCache += '<script src="' +
                config.base + modules[i] + '/' + modules[i] +
                (config.filter === 'debug' ? '-debug' : '-min') +
                '.js' + '"></script>';
        }

        return seedCache ? function (req, res, next) {

            // TODO: maybe using lang to replace a token

            // if express-expose is available, we surface some entries
            if (res.expose) {
                res.expose(seedCache, 'yui_seed');
            }

            next();

        } : false;

    }

};

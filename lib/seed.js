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

var utils = require('./utils'),
    DEFAULT_SEED = ['yui-base'];

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
    Expands the list of modules in the seed with
    their requirements. This technique helps to improve
    the time to get YUI ready in the client runtime when
    calling YUI().use() because, in theory, all the modules
    in the seed are ready to be used witout any computation
    to try to resolve their dependencies.
    This method will override `yui.config().seed` value.

    @method expandSeed
    @param {Array} modules list of modules to be expanded
    @return {function} express middleware
    **/
    expandSeed: function (modules) {

        // getting static config
        var config = this.config(),
            appModules = (config.groups && config.groups.app && config.groups.app.modules) || {},
            Y,
            loader;

        // using the modules provided as arguments or
        // falling back to the already configured seed or default seed.
        modules = [].concat(modules || config.seed || DEFAULT_SEED);

        Y = this.YUI({
            sync: true,
            modules: utils.clone(appModules) // cloning because loader will change it
        }).use('loader-base');

        // TODO: add config so that module expansion can be disabled if needed
        // expand modules
        loader = new Y.Loader({
            base: config.base,
            ignoreRegistered: true,
            require : modules
        });
        loader.calculate();

        // storing the expanded list in `yui.config().seed`
        config.seed = [].concat(loader.sorted);

        // clean up process since Y and loader holds big
        // data structures, better to release them.
        loader = null;
        Y = null;

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
            modules = config.seed || DEFAULT_SEED,
            seedCache = [],
            i;

        // producing an array of objects with the src
        // for each file in the seed.
        for (i = 0; i < modules.length; i += 1) {
            seedCache.push({
                src: config.base + modules[i] + '/' + modules[i] +
                    (config.filter === 'debug' ? '-debug' : '-min') +
                    '.js'
            });
        }

        return seedCache.length > 0 ? function (req, res, next) {

            // TODO: maybe using lang to replace a token

            res.locals.yui_seed = seedCache;

            next();

        } : false;

    }

};

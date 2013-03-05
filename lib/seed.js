/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `yui.seed` extension that provides a set of features
to construct the yui seed structure which contains the url
to fetch the initial piece of the library before
calling `YUI().use()` in the client runtime.

@module yui
@submodule seed
**/

'use strict';

var utils = require('./utils'),
    DEFAULT_SEED = ['yui-base'];

/**
The `yui.seed` middleware extension that provides a set of features
to configure and construct the yui seed object which
contains the urls to be used to fetch the initial pieces
of the yui library, plus any app specific modules
before calling `YUI().use()` in the client runtime.

When the `"seed"` sub-module is used by `yui` middleware, it
will automatically mix itself into `yui.expose()`, and it
exposes an array of object with the information to build
the script tag or tags that forms the seed:

The following is an example of how these features can be used:

    // Creates a new express app.
    var app = express();

    // Initialize yui middleware
    yui({}, 'path/to/yui/folder');

    // adjust the seed modules
    app.use(yui.seed(['yui-base', 'loader-base', 'loader-yui3']));

    // Call expose middleware when a route match.
    app.get('/index.html', yui.expose(), anotherRoute);

In the example above, the array of objects with the seed information
will be exposed thru `res.locals.yui_seed`, which means you
can use it in your templates by doing something like this if
using handlebars templates:

    {{#yui_seed}}
    <script src="{{{src}}}"></script>
    {{/yui_seed}}

@class seed
@static
@uses utils
@extensionfor yui
*/
module.exports = {

    /**
    Specify a list of modules to use as seed. This
    method extends the yui static configuration,
    specifically setting the `yui.config().seed` value.

        app.use(yui.seed(["yui-base", "loader-base"]));

    @method seed
    @public
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
    @experimental
    @public
    @param {Array} modules list of modules to be expanded
    @return {function} express middleware
    **/
    expandSeed: function (modules) {

        // getting static config
        var config = this.config(),
            Y,
            loader;

        // using the modules provided as arguments or
        // falling back to the already configured seed or default seed.
        modules = [].concat(modules || config.seed || DEFAULT_SEED);

        Y = this.YUI({
            sync: true,
            groups: utils.clone(config.groups || {})
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
    Expose the seed information to the client.
    Usually, `yui.expose()` will take care of calling
    `seed.exposeSeed()`, although you can do it directly.

    This method will expose an array thru
    `res.locals.yui_seed` with the following format:

        [
            {src: "path/to/yui.js"},
            {src: "path/to/another.js"}
        ]

    @method exposeSeed
    @protected
    @return {function} express middleware
    **/
    exposeSeed: function () {

        // getting static config
        var config = this.config(),
            modules = config.seed || DEFAULT_SEED,
            seedCache = [],
            map = this._map || {},
            groups = config.groups || {},
            group,
            path,
            i;

        // producing an array of objects with the src
        // for each file in the seed.
        for (i = 0; i < modules.length; i += 1) {
            group = null;
            if (map[modules[i]]) {
                group = groups[map[modules[i]].group];
                path = map[modules[i]].path;
            } else {
                group = config;
                path = modules[i] + '/' + modules[i] +
                    (config.filter === 'debug' ? '-debug' : '-min') +
                        '.js';
            }
            if (path && group) {
                seedCache.push({
                    src: group.base + path
                });
            } else {
                console.log('Skipping module [' + modules[i] + '] form ' +
                    'seed due to invalid group resolution.');
            }
        }

        return seedCache.length > 0 ? function (req, res, next) {

            // TODO: maybe using lang to replace a token

            res.locals.yui_seed = seedCache;

            next();

        } : false;

    }

};

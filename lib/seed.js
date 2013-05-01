/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `express-yui.seed` extension that provides a set of features
to construct the yui seed structure which contains the url
to fetch the initial piece of the library before
calling `YUI().use()` in the client runtime.

@module yui
@submodule seed
**/

'use strict';

/**
The `express-yui.seed` middleware extension that provides a set of features
to configure and construct the yui seed object which
contains the urls to be used to fetch the initial pieces
of the yui library, plus any app specific modules
before calling `YUI().use()` in the client runtime.

When the `"seed"` sub-module is used by `yui` middleware, it
will automatically mix itself into `app.yui.expose()`, and it
exposes an array of object with the information to build
the script tag or tags that forms the seed:

The following is an example of how these features can be used:

    // Creates a new express app.
    var app = express();
    // adjust the seed modules
    app.yui.seed(['yui-base', 'loader']);

    // Call expose middleware when a route match.
    app.get('/index.html', app.yui.expose(), anotherRoute);

In the example above, the array of objects with the seed information
will be exposed thru `res.locals.yui_seed`, which means you
can use it in your templates by doing something like this if
using handlebars templates:

    {{#yui_seed}}
    <script src="{{{src}}}"></script>
    {{/yui_seed}}

@class seed
@static
@extensionfor yui
*/
module.exports = {

    /**
    Gets the default list of module names that should
    be part of the seed files.

    @method getDefaultSeed
    @pretected
    @return {Array} list of modules in seed
    **/
    getDefaultSeed: function () {
        return ['yui'];
    },

    /**
    Adds a yui module name into the `core` YUI configuration
    which is used by loader to identify the pieces that are
    already part of the seed and should be attached to Y
    automatically.

    @method addModuleToSeed
    @public
    @param {String} moduleName the yui module name
    @param {String} groupName the group name for the module
    @chainable
    **/
    addModuleToSeed: function (moduleName, groupName) {

        var config = this.config();

        // add a new entry in the seed for the new meta module
        // so it gets embeded in the page.
        config.seed = config.seed || this.getDefaultSeed();
        config.seed.push(groupName ? moduleName + '@' + groupName : moduleName);

        // add a new entry in the extended core for the new meta
        // module to force to attach it when calling `use()`
        // for the first time for every instance.
        config.extendedCore = config.extendedCore || [];
        config.extendedCore.push(moduleName);

        return this;
    },

    /**
    Specify a list of modules to use as seed. This
    method extends the yui static configuration,
    specifically setting the `app.yui.config().seed` value.

        app.yui.seed(["yui-base", "loader"]);

    @method seed
    @public
    @param {Array} modules list of modules to use
    @return {function} express middleware
    @chainable
    **/
    seed: function (modules) {

        var config = this.config();
        if (config.seed && config.seed.length > 0) {
            console.warn('YUI seed has already been set, and you could ' +
                         'potentially be overwriting the default: ' +
                         config.seed.join(', '));
        }

        config.seed  = modules;

        return this;

    }

};

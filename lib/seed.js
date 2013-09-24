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

var debug = require('debug')('express:yui:seed');

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

    var express = require('express'),
        expyui = require('express-yui'),
        app = express();

    expyui.extend(app);
    // adjust the seed modules
    app.yui.seed(['yui-base', 'loader']);
    // Call expose middleware when a route match.
    app.get('/index.html', expyui.expose(), anotherRoute);

In the example above, the array of objects with the seed information
will be exposed thru `res.locals.yui_seed`, which means you
can use it in your templates by doing something like this if
using handlebars templates:

    {{#yui_seed}}
    <script src="{{{src}}}"></script>
    {{/yui_seed}}

@class seed
@static
@uses debug*
@extensionfor yui
*/
module.exports = {

    /**
    The default mapping for suffix based on the config `filter` value for js modules.

    @property JS_FILTERS_MAP
    @type {Object}
    **/
    JS_FILTERS_MAP: {
        raw: '',
        min: '-min',
        debug: '-debug'
    },

    /**
    The default mapping for suffix based on the config `filter` value for css modules.

    @property CSS_FILTERS_MAP
    @type {Object}
    **/
    CSS_FILTERS_MAP: {
        raw: '',
        min: '-min',
        debug: ''
    },

    /**
    The default filter suffix for yui modules urls.

    @property DEFAULT_FILTER
    @type {String}
    **/
    DEFAULT_FILTER: '-min',

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
    @chainable
    **/
    addModuleToSeed: function (moduleName) {

        var config = this.config();

        // add a new entry in the seed for the new meta module
        // so it gets embeded in the page.
        config.seed = config.seed || this.getDefaultSeed();
        config.seed.push(moduleName);

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

    },

    /**
    Build the list of urls to load the seed files for the app.

        var scripts = app.yui.getSeedUrls();

    As a result, `scripts` will be an array with one or more urls that
    you can use in your templates to provision YUI. Keep in mind that if
    use `expressYUI.expose()` middleware, you don't need to provision the
    seed, it will be provisioned automatically as part of the `state` object.

    @method getSeedUrls
    @public
    @param {object} customConfig optional configuration to overrule filter and combine per request when
                    building the urls. This is useful if you have a custom middleware to turn debug mode
                    on, and combine off by passing some special parameter.
        @param {string} customConfig.filter optional filter to overrule any filter
        @param {boolean} customConfig.combine optional flag to overrule combine,
                         when set to `false`, it will avoid creating combo urls.
    @return {Array} the `src` url for each script tag that forms the seed
    **/
    getSeedUrls: function (customConfig) {
        var config = this.config(),
            modules = config.seed || this.getDefaultSeed();
        return this._buildUrls(modules, 'js', this.JS_FILTERS_MAP, customConfig);
    },

    /**
    Build a list of urls to load a list of modules.

        var scripts = app.yui.buildJSUrls('node', 'photos@hermes');

    As a result, `scripts` will be an array with one or more urls that
    you can use in your templates to insert script tags.

    Modules as `photos@hermes` denotate a module from a particular group,
    as in `<module-name>@<group-name>`. Modules without the group denotation
    will be assumed as core modules from yui.

    @method buildJSUrls
    @public
    @param {string} modules* One or more module name (and optional @<group-name>)
    @return {Array} the `src` url for each script tag that forms the seed
    **/
    buildJSUrls: function () {
        return this._buildUrls(arguments, 'js', this.JS_FILTERS_MAP);
    },

    /**
    Build a list of urls to load a list of css modules.

        var links = app.yui.buildCSSUrls('cssbase', 'cssflickr@hermes');

    As a result, `links` will be an array with the urls that
    you can use in your templates to provision styles.

    Modules as `cssflickr@hermes` denotate a module from a particular group,
    as in `<module-name>@<group-name>`. Modules without the group denotation
    will be assumed as core modules from yui.

    @method buildCSSUrls
    @public
    @param {string} modules* One or more module name (and optional @<group-name>)
    @return {Array} the `href` url for each link tag to be inserted in the header of the page
    **/
    buildCSSUrls: function () {
        return this._buildUrls(arguments, 'css', this.CSS_FILTERS_MAP);
    },

    /**
    Build a list of urls for a list of modules. Modules are described as `<module-name>@<group-name>`.
    Modules without the group denotation will be assumed as core modules from yui. `ext` denotates
    the type of the modules since this routine is able to produce css or js modules alike.

    @method _buildUrls
    @protected
    @param {array} modules the array of modules to generate the urls.
    @param {string} ext the modules extension, `js` or `css`.
    @param {object} filterMap hash table to translate filter values into suffix for modules.
                              e.g.: `min` -> `-min`
    @param {object} customConfig optional configuration to overrule filter and combine per request when
                    building the urls
        @param {string} customConfig.filter optional filter to overrule any filter
        @param {boolean} customConfig.combine optional flag to overrule combine,
                         when set to `false`, it will avoid creating combo urls.
    @return {Array} the `href` url for each link tag to be inserted in the header of the page
    **/
    _buildUrls: function (modules, ext, filterMap, customConfig) {
        // getting static config
        var config = this.config(),
            urls = [],
            groups = config.groups || {},
            prevGroup,
            stack = [],
            groupName,
            groupConfig,
            path,
            filter,
            i,
            moduleName;

        function flush() {
            if (stack.length > 0) {
                urls.push(prevGroup.comboBase + stack.join(prevGroup.comboSep));
            }
            stack = [];
        }

        function isSimilarGroup(newGroup) {
            return newGroup && newGroup.combine && prevGroup && prevGroup.combine &&
                newGroup.comboBase === prevGroup.comboBase &&
                newGroup.comboSep === prevGroup.comboSep;
        }

        customConfig = customConfig || {};

        // producing an array of objects with the urls for the module.
        for (i = 0; i < modules.length; i += 1) {
            moduleName = modules[i];
            console.log(config.seed, Object.keys(this._clientModules), moduleName);
            if (this._clientModules[moduleName]) {
                groupName   = this._clientModules[moduleName].group;
                groupConfig = groups[groupName]; // group config
            } else {
                groupName   = 'yui';
                groupConfig = config; // core config
            }

            // computing the default filter for yui core modules
            // default is always -min
            filter = customConfig.filter || groupConfig.filter || config.filter; // inheriting from yui config
            filter = filter && filterMap && filterMap.hasOwnProperty(filter) ?
                    filterMap[filter] : this.DEFAULT_FILTER;

            // just build the url as loader will do at the client side.
            path = moduleName + '/' + moduleName + filter + '.' + ext;

            if (groupConfig) {

                if (customConfig.combine === false || !isSimilarGroup(groupConfig)) {
                    flush(groupConfig);
                }
                if (customConfig.combine !== false && groupConfig.combine) {
                    stack.push(groupConfig.root + path);
                } else {
                    urls.push(groupConfig.base + path);
                }
                prevGroup = groupConfig;

            } else {

                debug('Skipping module [%s] ' +
                    'due to invalid group resolution.', modules[i]);

            }

        }

        // flushing any remaining piece in stack
        flush();

        return urls;
    }

};

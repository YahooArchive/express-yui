/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node: true, nomen: true */

/**
The `express-yui.view` extension exposes an express view class that relies on all templates
exposed by all modules that are registered on the server side thru Loader, those
templates should be using Y.Template.

@module yui
@submodule view
**/

"use strict";
var utils = require('./utils');

/**
 * Initialize a new `View` with the given `name`.
 *
 * @class View
 * @param {String} name the name of the view
 * @param {Object} options
 * @static
 * @constructor
 * @api private
 */
function View(name, options) {
    options = options || {};
    this.name = name;
    this.path = name;
}

/**
 * Lookup view by the given `name`.
 * This method is supposed to be shimmed by yui to bind it to the Y instance on the server.
 *
 * @method lookup
 * @param {String} name the view name which is the first argument when calling `res.render()`
 * @param {Object} options the `options` passed as the second argument when calling `res.render()`
 * @return {function} the compiled view or null.
 * @api private
 */
View.prototype.lookup = function () {
    return null;
};

/**
 * Lookup layout view.
 * This method is supposed to be shimmed by yui to bind it to the Y instance on the server.
 *
 * @method layout
 * @param {Object} options the `options` passed as the second argument when calling `res.render()`
 * @return {function} the compiled layout view or null.
 * @api private
 */
View.prototype.layout = function () {
    return null;
};

/**
 * Render with the given `options` and callback `fn(err, str)`.
 *
 * @method render
 * @param {Object} options the `options` passed as the second argument when calling `res.render()`
 * @param {Function} fn the callback function.
 * @api private
 */
View.prototype.render = function (options, fn) {
    var template = this.lookup(this.path, options),
        layout = this.layout(options);

    if (!template) {
        throw new Error('Failed to lookup view "' + this.path + '"');
    }
    if (layout) {
        // rendering the layout
        options = utils.extend({}, options, { body: template(options) });
        template = layout;
    }
    fn(null, template(options || {}));
};

/**
The `express-yui.view` extension exposes an express view class that relies on all templates
exposed by all modules that are registered on the server side thru Loader, those
templates should be using Y.Template.

Here is an example:

    app.set('view', app.yui.view({ defaultBundle: 'locator-express' })

@class view
@static
@uses utils, server
@extensionfor yui
*/
module.exports = {

    /**
    Expose a View class for express.

        app.set('view', app.yui.view({ defaultBundle: 'app-name' });

    @method view
    @public
    @param {object} config The default configuration of the view engine.

        @param {object} defaultBundle The default group or bundle to lookup the template name.

    @return {function} the express view class
    **/
    view: function (config) {

        var self = this;

        config = config || {};

        utils.extend(View.prototype, {
            // augmenting the lookup mechanism to use the Y registered at the server side
            lookup: function (templateName, options) {
                var bundleName = (options && options.bundle) || config.defaultBundle,
                    Y = self.use(),
                    template;

                if (!bundleName) {
                    throw new Error('Invalid bundle name when looking up for template: ' + templateName +
                        '; make sure you set `defaultBundle` or you use ' +
                        '`res.render(templateName, { bundle: bundleName })` to specify the bundle name.');
                }

                try {
                    template = Y.Template._cache[bundleName + '/' + templateName];
                } catch (e) {
                    throw new Error('Error trying to access template `' + templateName + '`' +
                        ' from bundle `' + bundleName + '`; make sure the template was compiled correctly.');
                }
                return template;
            },
            layout: function (options) {
                var layoutName = (options && options.layout) || config.defaultLayout;
                return layoutName && this.lookup(layoutName, options);
            }
        });

        return View;

    }

};
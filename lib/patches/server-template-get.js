/**
Patches `Y.Template.get` to use the templates produced by
`locator-handlebars` or any other similar plugin, and will be available
thru locator's bundle objects on the server side.

@module express-yui/lib/patches/server-template-get
**/

/**
Patches `Y.Template.get` to use the templates produced by
`locator-handlebars` or any other similar plugin, and will be available
thru locator's bundle objects on the server side.

    app.yui.patch(require('express-yui/lib/patches/server-template-get'));

Then you can use this in your program:

    Y.Template.get('foo');

This will resolve `foo` as a template from the default locator
bundle, which is normally a file in `templates/foo.handlebars` or any other template
engine that is available, and that it was transpiled into a module by `locator-handlebars`.

@method patchTemplateGet
@param {Object} Y YUI instance
**/
module.exports = function patchTemplateGet(Y) {
    // monkey patching Y.Template
    var locator = this._app.get('locator'),
        // looking in the root bundle (hermes has only one bundle)
        // that's the most common use-case where the app bundle holds all templates
        rootBundle = locator.getRootBundle(),
        originalTemplateGet = Y.use('template-base').Template.get;

    Y.Template.get = function (name) {
        var pos = name.indexOf('/'),
            bundleName,
            bundle,
            template = name;
        if (pos > 0) {
            bundleName = name.slice(0, pos);
            template = name.slice(pos + 1, name.length);
        }
        bundle = bundleName ? locator.getBundle(bundleName) : rootBundle;
        if (bundle.template && bundle.template[template]) {
            return bundle.template[template];
        }
        // if the template is not in the specified bundle, look for a global/root template
        if (bundle !== rootBundle && rootBundle.template && rootBundle.template[name]) {
            return rootBundle.template[name];
        }
        // falling back to the original implementation
        return originalTemplateGet.apply(this, arguments);
    };
};

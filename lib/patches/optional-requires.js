/**
Patches `Y.Loader` to support `optionalRequires`, which enables you to
require modules that might not be available in a runtime, and avoid to
throw when that happens.

@module express-yui/lib/patches/optional-requires
**/

/**
Patches `Y.Loader` to support `optionalRequires`, which enables you to
require modules that might not be available in a runtime, and avoid to
throw when that happens.

This helps when it comes to define modules that are only available on
the server or client, while other modules that are common can require
them as optionals.

    app.yui.patch(require('express-yui/lib/patches/optional-requires'));

Note that the `optional` implementation in YUI does not cover this case,
and it only covers the case where the module was required or not by another
module in the `use` statement, which is not quite the same.

@method default
@param {Object} Y YUI instance
**/
module.exports = function (Y) {
    var getRequires = Y.Env._loader.getRequires;
    Y.Env._loader.getRequires = function (mod) {
        var i, m;
        if (!mod) {
            return [];
        }
        if (mod._parsed) {
            return mod.expanded || [];
        }
        mod.requires = mod.requires || [];
        // expanding requirements with optional requires
        if (mod.optionalRequires) {
            for (i = 0; i < mod.optionalRequires.length; i += 1) {
                m = this.getModule(mod.optionalRequires[i]);
                if (m) {
                    mod.requires.push(m.name);
                }
            }
        }
        return getRequires.apply(this, arguments);
    };
};

/*
 * Copyright (c) 2014, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint nomen: true */

/**
Patches `Y.Loader` to support conditional behaviors described by any
condition added thru `app.yui.applyCondition()`.

And you can enable the patch like this:

    app.yui.patch(require('express-yui/lib/patches/yepnope'));

Then you can apply conditions like this:

    app.yui.applyCondition('intl-messageformat', {
        test: function (Y) {
            return !!Y.config.global.Intl
        },
        nope: ['intl-polyfill'],
        yep: []
    });

This will guarantee, that the module denoted by `intl-polyfill` will be
attached before `intl-messageformat` if a global `Intl` member does not exists.

@module express-yui/lib/patches/yepnope
**/
module.exports = function patchYepNope(Y, loader) {
    var getRequires = loader.getRequires,
        conditions = Y.config.conditions;

    function executeCond(cond) {
        var list = [].concat(Y.Array(cond.both || []), Y.Array(cond.load || []));
        if (!cond.hasOwnProperty('test')) {
            cond.test = true;
        }
        if (typeof cond.test === 'function') {
            // intentionally caching the result of the test
            cond.test = cond.test(Y);
        }
        return [].concat(Y.Array((cond.test ? cond.yep : cond.nope) || []), list);
    }

    loader.getRequires = function (mod) {
        var i, m, c,
            triggerConds = conditions[mod.name],
            r = getRequires.apply(this, arguments),
            list;

        if (!mod.conditionsExpanded && triggerConds && triggerConds.length) {
            mod.conditionsExpanded = [];
            for (c = 0; c < triggerConds.length; c += 1) {
                // execting a condition
                list = executeCond(triggerConds[c]);
                for (i = 0; i < list.length; i += 1) {
                    m = this.getModule(list[i]);
                    if (m) {
                        // module is in meta, adding it the expanded list
                        mod.conditionsExpanded = mod.conditionsExpanded.concat(this.getRequires(m), [m.name]);
                    } else if (list[i].match(/\.(js|css)$/)) {
                        // if the module is a fullpath css or js, we can create
                        // a synthetic module and add it to the expanded list
                        this.addModule(list[i]);
                        mod.conditionsExpanded.push(list[i]);
                    } else {
                        throw new Error('Invalid conditional dependency [' + list[i] + '], module is not registered.');
                    }
                }
            }
        }
        return mod.conditionsExpanded && mod.conditionsExpanded.length ?
                [].concat(mod.conditionsExpanded, r) : r;
    };
};

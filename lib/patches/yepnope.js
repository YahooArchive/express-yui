/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

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

This will guarantee, that the module denotated by `intl-polyfill` will be
attached before `intl-messageformat` if a global `Intl` member does not exists.

@module express-yui/lib/patches/yepnope
**/
module.exports = function patchTemplatesRequires(Y, loader) {
    var getRequires = loader.getRequires,
        conditions = Y.config.conditions;

    function executeCond(cond) {
        var list = [].concat(cond.both || []).concat(cond.load || []);
        if (!cond.hasOwnProperty('test')) {
            cond.test = true;
        }
        if (typeof cond.test === 'function') {
            cond.test = cond.test(Y);
        }
        return [].concat(cond.test ? cond.yep || [] : cond.nope || [], list);
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
                        mod.conditionsExpanded = mod.conditionsExpanded.concat(this.getRequires(m), [m.name]);
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

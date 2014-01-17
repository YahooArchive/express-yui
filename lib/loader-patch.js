/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
Provides hooks to patch the YUI loader on both the server and/or client.
@module express-yui/lib/loader-patches
**/

'use strict';

module.exports = {

    /**
    Adds patches that will be applied to the YUI instance
    before the initial `use` statement on the client side.

    @method patchClient
    @public
    @param {Function*} patch Each argument represent a patch to be applied to the client runtime
    **/
    patchClient: function () {
        var patches = this.config().patches;
        patches.push.apply(patches, arguments);
    },

    /**
    Adds patches that will be applied to the YUI instance
    before the initial `use` statement on the server side.

    @method patchServer
    @public
    @param {Function*} patch Each argument represent a patch to be applied to the server runtime
    **/
    patchServer: function () {
        var patches = this._patches;
        patches.push.apply(patches, arguments);
    },

    /**
    Adds patches that will be applied to the YUI instance
    before the initial `use` statement on the server side and client.
    Here is an example of how to use this:

        app.yui.patch(require('express-yui/lib/patches/optional-requires'));

    @method patch
    @public
    @param {Function*} patch Each argument represent a patch to be applied
    **/
    patch: function () {
        this.patchClient.apply(this, arguments);
        this.patchServer.apply(this, arguments);
    }

};

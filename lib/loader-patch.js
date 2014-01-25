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

/**
Provides hooks to patch the YUI loader on both the server and/or client.
It will facilitate try new things and patches without requiring to wait
for YUI to be released. Here is an example:

    app.yui.patch(require('express-yui/lib/patches/optional-requires'));

In the example above, one of the default patches shipped with with
`express-yui`, is executed on the server and client to patch the
YUI Loader to support a new type of metadata called `optionalRequires`,
which provides an easy way to define requirements for a module that are
not avialable in all runtimes.

@class loader-patch
@static
@extensionfor express-yui/lib/yui
*/
module.exports = {

    /**
    Adds patches that will be applied to the YUI instance
    before the initial `use` statement on the client side.

        app.yui.patchClient(require('express-yui/lib/patches/templates-requires'));

    @method patchClient
    @public
    @param {Function*} patch Each argument represent a patch to be applied to the client runtime
    **/
    patchClient: function () {
        var config  = this.config(),
            patches = config.patches;

        patches.push.apply(patches, arguments);
    },

    /**
    Adds patches that will be applied to the YUI instance
    before the initial `use` statement on the server side.

        app.yui.patchServer(require('express-yui/lib/patches/server-template-get'));

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

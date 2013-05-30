/*
 * Copyright (c) 2013, Yahoo! Inc.  All rights reserved.
 * Copyrights licensed under the New BSD License.
 * See the accompanying LICENSE file for terms.
 */

/*jslint node:true, nomen: true */

/**
The `express-yui.client` extension that provides a set of features
to control a YUI instance on the client side. This module will be
serialized and sent to the client side thru `res.expose()` and available
in the client side thru `window.app.yui`.

@module yui
@submodule client
**/

module.exports = {

    /**
    Attaches the seed into the head, then creates a YUI Instance and attaches
    `modules` into it. This is equivalent to `YUI().use()` after getting the seed
    ready. This method is a bootstrap implementation for the library, and the way
    you use this in your templates, is by doing this:

        <script>{{{state}}}</script>
        <script>
        app.yui.use('foo', 'bar', function (Y) {
            // do something!
        });
        </script>

    Where `state` defines the state of the express app, and `app.yui` defines
    the helpers that `express-yui` brings into the client side.

    @method use
    @public
    **/
    use: function () {
        var d = document,
            // Some basic browser sniffing...
            ie = /MSIE/.test(navigator.userAgent),
            pending = 0, // number of seed parts that are still pending
            callback = [], // it is just a queue of pending "use" statements until YUI gets ready
            args = arguments,
            booted, // whether or not the seed was already attached to the page
            Y;

        function flush() {
            var l = callback.length,
                i;
            // callback on every pending use statement
            for (i = 0; i < l; i++) {
                callback.shift()();
            }
        }

        function decrementRequestPending() {
            pending--;
            if (pending <= 0) {
                setTimeout(flush, 0);
            }
        }

        function createScriptNode(src) {
            var node = d.createElement('script');

            if (ie) {
                node.onreadystatechange = function () {
                    if (/loaded|complete/.test(this.readyState)) {
                        this.onreadystatechange = null;
                    }
                    decrementRequestPending();
                };
            } else {
                node.onload = node.onerror = decrementRequestPending;
            }
            node.setAttribute('src', src);
            return node;
        }

        function load(seed) {
            var head = d.getElementsByTagName('head')[0],
                l = seed.length,
                i;

            pending = seed.length;
            for (i = 0; i < l; i++) {
                head.appendChild(createScriptNode(seed[i]));
            }
        }

        callback.push(function () {
            if (!Y) {
                // extend core (YUI_config.extendedCore)
                YUI.Env.core.push.apply(YUI.Env.core, YUI_config.extendedCore || []);
                // create unique instance which is accesible thru app.yui.use()
                Y = YUI();
            }
            // call use for arguments
            Y.use.apply(Y, args);
        });

        if (!booted) {
            booted = true;
            // attach seed and wait for it to finish to flush the callback
            load(YUI_config.seed);
        } else if (pending <= 0) {
            // everything is ready, just flush
            flush();
        } // else do nothing, the current pending job will take care of flushing callback

    },

    /**
    Boots the application, rehydrate the app state and calls back to notify the
    `ready` state of the app.

        <script>{{{state}}}</script>
        <script>
        app.yui.ready(function () {
            // do something!
        });
        </script>

    @method ready
    @param {Function} callback when the app is ready
    @public
    **/
    ready: function (callback) {
        this.use(callback);
    }

};
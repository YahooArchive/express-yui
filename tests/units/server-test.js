/*
* Copyright (c) 2013, Yahoo! Inc. All rights reserved.
* Copyrights licensed under the New BSD License.
* See the accompanying LICENSE file for terms.
*/

/*jslint node:true, nomen:true*/

"use strict";

var YUITest = require('yuitest'),
    mockery = require('mockery'),
    A = YUITest.Assert,
    OA = YUITest.ObjectAssert,
    suite,
    server;

suite = new YUITest.TestSuite("expres-yui server suite");

suite.add(new YUITest.TestCase({
    name: "server-test",

    _should: {
        error: {
            "test ready without locator": true
        }
    },

    setUp: function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        server = require('../../lib/server.js');
        server._clientModules = {};
        server._serverModules = {};
        server.YUI = {};
        server._app = {
            _mockAttrs: {},
            // express app
            set: function (name, value) {
                this._mockAttrs[name] = value;
            },
            get: function (name) {
                return this._mockAttrs[name];
            }
        };
    },

    tearDown: function () {
        server = null;
        mockery.disable();
    },

    "test constructor": function () {
        A.isNotNull(server, "server require failed");
    },

    "test empty registerBundle": function () {
        var bundle = { name: 'foo' };
        // attaching for the first time
        var result = server.registerBundle(bundle);
        A.areEqual(server, result, 'registerBundle should be chainable');
    },

    "test registerBundle with client stuff": function () {
        var bundle = {
            name: 'bar',
            buildDirectory: __dirname,
            yui: {
                client: {
                    foo: {
                        group: 'abc'
                    }
                },
                metaModuleName: 'loader-foo'
            }
        };
        server._clientModules = {
            foo: {
                group: 'efg'
            }
        };
        YUITest.Mock.expect(server, {
            method: 'registerGroup',
            args: ['bar', __dirname, 'loader-foo']
        });
        server.registerBundle(bundle);
        A.areSame('abc', server._clientModules.foo.group, 'internal registry with _clientModules was not successfully updated');
    },

    "test registerBundle with server stuff": function () {
        var bundle = {
            name: 'bar',
            buildDirectory: __dirname,
            yui: {
                server: {
                    bar: {
                        group: 'abc'
                    }
                }
            }
        };
        server._serverModules = {
            bar: {
                group: 'efg'
            }
        };
        YUITest.Mock.expect(server.YUI, {
            method: 'applyConfig',
            args: [YUITest.Mock.Value.Object]
        });
        server.registerBundle(bundle);
        A.areSame('abc', server._serverModules.bar.group, 'internal registry with _serverModules was not successfully updated');
    },

    "test use": function () {
        var Y = YUITest.Mock(),
            result,
            attachedModules = {};

        server._app.set('locator', {
            getRootBundle: function () {}
        });
        YUITest.Mock.expect(server, {
            method: 'config',
            args: [],
            callCount: 3,
            run: function () {
                return {
                    groups: {
                        'foo': {
                            more: 1
                        }
                    }
                };
            }
        });
        Y.use = function () {
            Array.prototype.slice(arguments).forEach(function (name) {
                attachedModules[name] = true;
            });
            return Y;
        };
        Y.Env = { _loader: { getRequires: function () {} } };
        Y.Template = { get: function () {} };
        Y.Intl = { get: function () {} };
        YUITest.Mock.expect(server, {
            method: 'YUI',
            callCount: 1,
            args: [YUITest.Mock.Value.Object],
            run: function (c) {
                A.isTrue(c.useSync, 'useSync is required when running on the server');
                return Y;
            }
        });
        server.YUI.applyConfig = function () {};

        // first pass
        result = server.use();
        A.areSame(Y, result);

        // second pass
        result = server.use('foo', 'baz', 'bar');
        A.areSame(Y, result);

        // third pass
        result = server.use('foo', 'baz', 'bar');
        A.areSame(Y, result);
        A.areSame(Y, server._Y, 'private _Y used by other internal methods was not exposed');

        YUITest.Mock.verify(server);
        YUITest.Mock.verify(Y);
    },

    "test hook for patching loader": function () {
        var Y = YUITest.Mock(),
            newUse = function () {
                used = 'useCalled';
            },
            used = 'useNotCalled',
            result;

        YUITest.Mock.expect(server, {
            method: 'config',
            args: [],
            callCount: 1,
            run: function () {
                return {
                    groups: {
                        'foo': {
                            more: 1
                        }
                    }
                };
            }
        });

        YUITest.Mock.expect(server, {
            method: 'YUI',
            callCount: 1,
            args: [YUITest.Mock.Value.Object],
            run: function (c) {
                A.isTrue(c.useSync, 'useSync is required when running on the server');
                return Y;
            }
        });

        server._app.set('locator', {
            getRootBundle: function () {}
        });

        server.YUI.applyConfig = function () {};

        server._patches = [
            function (Y) {
                Y.use = newUse;
                // This `use` should be invoked after patching occurs
                A.areSame('useNotCalled', used);
            }
        ];

        result = server.use('foo', function (Y) {
            // The patch should have been applied
            A.areEqual(newUse, Y.use);
            // The `use` statement should have been invoked
            A.areSame('useCalled', used);
        });

        YUITest.Mock.verify(server);
        YUITest.Mock.verify(Y);
    },

    "test ready without locator": function () {
        server.ready(function () {});
        // this test is meant to throw because server._app.get('locator') is not set.
    },

    "test ready fulfilled": function () {
        server._app.set('locator', {
            getBundle: function (name) {
                return {
                    foo: {},
                    bar: {}
                }[name];
            },
            listBundleNames: function () {
                return ['foo', 'bar'];
            },
            ready: {
                then: function (fulfilled, rejected) {
                    fulfilled();
                }
            }
        });
        server.ready(function (err) {
            A.isUndefined(err, 'the ready promise should be fulfilled');
        });
    },

    "test ready rejected": function () {
        var rejection = new Error('this should be propagated');
        server._app.set('locator', {
            ready: {
                then: function (fulfilled, rejected) {
                    rejected(rejection);
                }
            }
        });
        server.ready(function (err) {
            A.isObject(err, 'the ready promise should be rejected');
            A.areSame(rejection, err, 'the promise rejection error should be propagated');
        });
    }

}));

YUITest.TestRunner.add(suite);

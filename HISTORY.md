Express YUI Change History
==========================

@NEXT@
------------------

* bugfix to support a `build.json` file at the top level in a bundle.

0.6.0 (2013-08-16)
------------------

* __[!]__ `expyui.extend(app)` is required to be able to extend an express application with `express-yui`. (PR #24)
* __[!]__ `expyui.augment(app)` is now deprecated in favor of `expyui.extend(app)`. (PR #24)
* removing `options.useServerModules` for `app.yui.plugin()`. locator plugin will no longer accept `useServerModules`, you either call `app.yui.attachModules("foo", "bar")` explicitely, or add an array to `bundle.useServerModules` with the list of modules to be attached, e.g.: pre-compiled templates, and that could happen in any plugin. (PR #25)

0.5.9 (2013-07-29)
------------------

* using `express-state` to augment the express app.

0.5.8 (2013-07-29)
------------------

* adding `debug` middleware to control it per request
* making `expose` middleware connect/express compatible.

0.5.7 (2013-07-24)
------------------

* adding support for `cssproc` option thru `app.yui.plugin({ cssproc: true})`.

0.5.6 (2013-07-22)
------------------

* yui is now locked down to 3.11.x

0.5.5 (2013-07-15)
------------------

* adding support for `app.yui.buildJSUrls('dom', 'photos@hermes')` to produce urls to load modules.
* adding support for `app.yui.buildCSSUrls('cssbase', 'flickr@hermes')` to produce urls to load css modules.

0.5.4 (2013-07-08)
------------------

* `defaultBundle` is not longer required, and it will be computed automatically based on the locator information about the bundles. You can still define it if needed, specially when the top level package is not the one providing templates.

0.5.3 (2013-06-27)
------------------

* default setting for core modules to point to CDN.

0.5.2 (2013-06-21)
------------------

* removing prefix `templates/` when calling for `res.render()`, this is not needed anymore.
* adding support for partials, which are language specific.
* better error reporting when loader fails to load a template without bundle
* using `outlet` instead of `body` to inject the result of the view into the selected layout.

0.5.1 (2013-06-20)
------------------

* all groups registered are now provisioned on the server side
* yui is now locked down to 3.10.x
* adding better error reporting when loader fails to load a module on the server side

0.5.0 (2013-06-19)
------------------

* refactor to integrate with `express-state`.
* using `app.yui.*` api on server and client.
* bootstrap to load `seed` files in paralell and non-blocking.
* integration with the new `locator`
* many bugfixes and reorganization of the code

0.4.4 (2013-06-19)
------------------

* adding a hook for locator plugins to force attaching a yui module thru `evt.bundle.useServerModules` array. this is useful for compiled templates and other basic yui modules.

0.4.3 (2013-06-17)
------------------

* adding custom options for `app.yui.plugin()` to control the `lint`, `coverage`, `silence` and `quiet` arguments used by shifter. by default, the plugin will print out shifter output
when `process.env.NODE_ENV` is `development`.

0.4.2 (2013-06-13)
------------------

* avoid executing arbitrary scripts while trying to detect yui modules in all files by using a custom context that does not have `require` or `module`. this enforces the use of `YUI.add()` to wrap everything into the function that defines the module.

0.4.1 (2013-06-13)
------------------

* exposing `yui.augment(app)` as a static method to augment an existing express app instance
* exposing `yui.extend(express)` as a static method to extend express module.

0.4.0 (2013-06-07)
------------------

* registration and setting for groups are now decoupled (order does not matter anymore).
* introducing `app.set('yui default base', 'http://path/to/cdn/{{groupDir}}/');`
* introducing `app.set('yui default root', 'something/{{groupDir}}/')'`
* introducing `app.set('yui combo config', { comboBase: '/combo?', comboSep: '?', maxURLLength: 1024})`
* removing `app.yui.setGroupFromCDN()`, use `applyGroupConfig` instead.
* removing `app.yui.setGroupFromAppOrigin()`, that's the new default behavior and you can use `applyGroupConfig` if you need more granularity.
* removing `app.yui.combineGroups()`, it will inherit from the top level `combine` value.
* from now on, the folder that represents the build directory for the bundle will be used as the `root` for loader, so the version of the bundle will be included.
* `combine` is now inherited by default from top level or defaults to `true`
* `filter` is now inherited by default from top level or defaults to `min`

0.3.3 (2013-05-30)
------------------

* Cleaning up the cache entry when shifter fails to process a file to avoid successive runs to hide failures due to cached entries.

0.3.2 (2013-05-29)
------------------

* bugfix for filter that was producing relative path for shifter instead of fullpath.

0.3.1 (2013-05-24)
------------------

* Adding support for `filter` configuration when creating a loader plugin to exclude
files from the shifting process.

0.3.0 (2013-05-23)
------------------

* Renamed to `express-yui`
* Open sourced
* Published in npm

0.0.1 (2013-03-01)
------------------

* Initial release.

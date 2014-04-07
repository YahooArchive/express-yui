Express YUI Change History
==========================

@NEXT@
------------------

1.3.2 (2014-04-07)
------------------

* Bugfix [PR #57] support for multiple calls to `app.yui.use()` and `app.yui.ready()`.

1.3.1 (2014-03-24)
------------------

* Bugfix [PR #54] better error control for `app.yui.ready()`.

1.3.0 (2014-03-18)
------------------

* [PR #51] Add support for Y.require() which requires YUI 3.15.0.

1.2.0 (2014-02-18)
------------------

* __[!]__ Leverage express-state's `cache` option to improve `expose()` performance.
  If changes to the YUI configuration need to be made after the first request, the
  app's YUI config now _must_ be re-exposed.

1.1.2 (2014-02-13)
------------------

* default lang bundle should be used if a custom lang bundle is not available

1.1.1 (2014-02-11)
------------------

* `patches` does not rely on `locator` info anymore, yui modules instead.
* remove the server `Y.Template.get` patch
* server and client feature parity for all patches that are common
* adding cache layer for all patches (e.g.: `mod.templatesExpanded`)
* normalizing patches to receive `Y` and `loader` in case the patch requires to run before the loader gets ready.

1.1.0 (2014-01-21)
------------------

* add api to allow patching the YUI instance before the loader `use` statement
    * `app.yui.patchServer(patchFn)` for patching the server instance
    * `app.yui.patchClient(patchFn)` for patching the client instance
    * `app.yui.patch(patchFn, anotherFn)` for patching both the client and server instances
    * all default patches are accesible thru: `require('express-yui/lib/patches/optional-requires')`
* add default `logLevel` to be `warn` by default to avoid
the masive amount of logs from yui core modules.

## Important (non-backward compatible) changes:

* __[!]__ Patches for loader to support `templates: []` and `Y.Template.get()` are disabled by default.
* __[!]__ Patches for loader to support `langBundles: []` and `Y.Intl.get()` are disabled by default.
* __[!]__ Patches for loader to support `optionalRequires: []` is disabled by default.

1.0.1 (2013-12-04)
------------------

* add debugging messages to log when name collision happens while express-yui tries to add those modules into clientModules or serverModules collection.
* PR #38: Fix jshint npm script to work on Windows
* Fix early calls of `flush()` inside of the bootstrap code. ([#41][])

[#41]: https://github.com/yahoo/express-yui/issues/41

1.0.0 (2013-10-26)
------------------

## Important (non-backward compatible) changes:

* __[!]__ moving `lib/view.js` into a separate component called `express-view`, which means that `app.yui.view()` is not longer available.
* __[!]__ moving `lib/shifter.js` into a separated component called `locator-yui`.
* __[!]__ moving `lib/loader.js` into its own component called `locator-yui`, which means that `app.yui.plugin()` is not longer available.
* __[!]__ removing already deprecated method `app.yui.debugMode()`, use `.debug()` middleware instead.
* __[!]__ removing already deprecated method require('express-yui').augment(), use `.extend()` instead.
* __[!]__ removing support for built-in combo handler.
* __[!]__ non-backward compatible change on `app.set('yui default base', 'http://path/to/cdn/');`, it should point to the build folder in CDN without the need to pass `{{groupDir}}`
* __[!]__ non-backward compatible change on `app.set('yui default root', 'something/')'`, it should hold the path from combo to the build folder without the need to pass `{{groupDir}}`
* __[!]__ `express-yui` does NOT longer add support for combo out of the box (we plan to provide support for that in `express-combo`)
* __[!]__ `expyui.static` is now equivalent to `express.static` in format and behavior. It returns an express application instance that can be mounted like `app.use(expyui.static(__dirname + '/build'))` or under a particular path `app.use('/static', expyui.static(__dirname + '/build'));`. This `static` middleware will also expose the folder that you provide (usually the locator build directory) and it will also expose YUI build folder thru NPM dependency. The actual behavior of serving files is pretty much the same as before.
* __[!]__ `locator.watch()` is not longer supported in `express-yui`.

## Other changes:

* using `bundleObj.yui` as the source of truth for yui meta data.
* `app.yui._clientModules` and `app.yui._serverModules` are exposed as protected properties in case you need to mess around with the loader on server and client.
* `app.yui.addModuleToSeed()` does not require a second argument specifying the group of the module to be added to seed, this is now resolved thru `app.yui._clientModules` registry.
* `app['@yui']` stores a reference to the extension function to align with the express extension pattern.
* feature pairity between server and client. You can, and should, use `app.yui.ready()` on the server as well to wait for YUI to be ready before serving traffic. This method has the same signature than the client version and on the server it is bound to the locator object to fulfill its internal `ready` promise.
* `app.yui.registerGroup()` signature changed. The optional 3rd argument is not longer a filesystem path to the meta module, but just the meta module name produced by `locator-yui`.
* `app.yui.registerModules()` was removed. Modules will be registered automatically thru `locator-yui` or you can do it manually thru the protected registries `app.yui._clientModules` and `app.yui._serverModules`, or you can explore `app.yui.registerBundle()` method.

## Patching yui loader to support:

* `templates: ['foo', 'bar']`, which is equivalent to say `requires: ['<bundleName>-template-foo', '<bundleName>-template-bar']`. This brings templates as first class citizen for loader, and avoid the necessity to know how the compiled yui module for the template was named since the only name that matters is the filename of the template.
* `langBundles: ['bar', 'baz']`, which is equivalent to say `requires: ['<bundleName>-lang-bar', '<bundleName>-lang-baz']`. This declouple the lang bundles from the name of the module, and allow us to specify what bundle should be attached independently of the module name of the requirer. This also brings lang bundles as first class citizen for loader, and avoid the necessity to know how the compiled yui module for the lang bundle was named since the only name that matters is the filename of the lang bundle. The locale/lang will be filled in by loader on the client side based on `Y.config.lang`, and on the server side it will use the language defined based on the request.
* `optionalRequires: ['xyz', 'qwe-server']`, which helps to require a yui module that might or might not be available in the current runtime, which means that you can require a server only module as optional in a client module without triggering an error. The difference between this and the loader original `optional` feature is that `optional` will only attach the module if some other module is requiring it, or it is was specified manually in the same `use` statement, guaranteeing the order in which those modules were attached, but `optionalRequires` will look into the guts of loader to see if the module is really available in the runtime before trying to use is as a regular requirement.

_more info about loader here:_ http://yuilibrary.com/yui/docs/api/classes/Loader.html#method_addModule

0.6.3 (2013-09-16)
------------------

* Bump `express-state` dependency to at least v1.0.1, which includes escaping of the javascript blob that holds the state of the app exposed to the client side.

0.6.2 (2013-09-16)
------------------

* relaxing the yui dependency to support 3.x.

0.6.1 (2013-09-11)
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

Express YUI Change History
==========================

0.5.1 (2013-06-21)
------------------

* removing prefix `templates/` when calling for `res.render()`, this is not needed anymore.
* adding support for partials, which are language specific.
* better error reporting when loader fails to load a template without bundle

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
Express YUI
=============

[Express][] extension for YUI Applications.

[![Build Status](https://travis-ci.org/yahoo/express-yui.png?branch=master)][Build Status]


[Express]: https://github.com/visionmedia/express
[Build Status]: https://travis-ci.org/yahoo/express-yui


Goals & Design
--------------

This compontent extends express by adding a new member to the
express application thru `app.yui`. This object is responsible
for exposing the `yui_config` and `yui_seed` configurations into
the view engine. Also, it provides a set of runtime
utilities that can be used to customize the YUI config for
the client side, creates a Y instance on the server side when
needed to provide access to the registered modules on the server
side, and provides a set of middleware to expose data into the
runtime and the client side.

Installation
------------

Install using npm:

```shell
$ npm install express-yui
```


Features
--------

## Features

 * expose yui config per request
 * expose seed files per request
 * provide basic configurations for cdn, debug, and other common conditions
 * provide basic middleware to server `static` assets from origin server, including
combo capabilities built-in.
 * provide basic middleware to `expose` `yui_config` and `yui_seed` into the view engine
so they can be used in the templates to boot YUI in the client side.

## Other features

 * work with modown-locator to produce a build process by shifting any yui module
in the application bundle or any other bundle.
 * provide basic express view engine to rely on views registered at the server side
thru the `app.yui.use()` as compiled templates.


Usage
-----

## Exposing app state into client

TBD

## Using yui modules on the server side

TBD

## Serving static assets from app origin

```
app.yui.setCoreFromAppOrigin();
app.use(yui.static());
``

With this configuration, a group called `foo` with version `1.2.3`, and `yui` version `3.10.2`, it will produce urls like these:

  * /combo~/yui-3.10.2/yui-base/yui-base-min.js~/foo-1.2.3/bar/bar-min.js~/foo-1.2.3/baz/baz-min.js
  * /yui-3.10.2/yui-base/yui-base-min.js
  * /foo-1.2.3/bar/bar-min.js

## Serving static assets from CDN

If you plan to serve the build folder from CDN, then make sure you set that
before registering any group, so loader can know about it. Here is the example:

```
app.set('yui combo config', {
    comboBase: 'http://mycdn.com/path/to/combo?',
    comboSep: '&',
    maxURLLength: 1024
});
app.set('yui default base', 'http://mycdn.com/path/to/static/{{groupDir}}/');
app.set('yui default root', 'static/{{groupDir}}/');
```

in which case you don't need to use `yui.static` middleware since you are not
serving local files.

With this configuration, a group called `foo` with version `1.2.3` will produce urls like these:

  * http://mycdn.com/path/to/combo?static/foo-1.2.3/bar/bar-min.js&static/foo-1.2.3/baz/baz-min.js
  * http://mycdn.com/path/to/static/foo-1.2.3/bar/bar-min.js

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/express-yui/blob/master/LICENSE.md


Contribute
----------

See the [CONTRIBUTE file][] for info.

[CONTRIBUTE file]: https://github.com/yahoo/express-yui/blob/master/CONTRIBUTE.md

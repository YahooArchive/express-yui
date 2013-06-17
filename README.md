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

## Extending express functionalities

`express-yui` is a conventional `express` extension, which means it will extend
the functionalities provided on `express` by augmenting the express app instance
with a new member called `yui`. At the same time, `express-yui` provides a set of
static methods that you can call directly off the `express-yui` module, those
methods are utility methods and express middleware.

Aside from that, `express-yui` will try to extend the `express` peer dependency to
augment the app instance automatically everytime you call `express()` to create a
brand new instance. This is useful, and in most cases just enough. Here is an example:

```
var express = require('express'),
    yui = require('express-yui'),
    app = express();

app.yui.applyConfig({ foo: 'something' });
```

As you can see in the example above, the `yui` member is now available for the app, and
the only thing you have to keep in mind is the order of the `require` statements.

But this is not always the case. Sometimes you have a 3rd party module that is requiring
`express`, and even creating the app under the hood, in which case you can just augment
an existing express app instance by doing this:

```
var yui = require('express-yui'),
    express = require('express'),
    app = express();

// calling a yui static method to augment the `express` app instance
yui.augment(app);

app.yui.applyConfig({ foo: 'something' });
```

## Exposing app state into client

TBD

## Using yui modules on the server side

TBD

## Using the locator plugin to build the app

TBD

## Serving static assets from app origin

```
app.yui.setCoreFromAppOrigin();
app.yui.registerGroup('foo', 'path/to/foo-1.2.3'); // if you use locator, this is not needed
app.use(yui.static());
```

With this configuration, a group called `foo` with version `1.2.3`, and `yui` version `3.10.2`, it will produce urls like these:

  * /combo~/yui-3.10.2/yui-base/yui-base-min.js~/foo-1.2.3/bar/bar-min.js~/foo-1.2.3/baz/baz-min.js
  * /yui-3.10.2/yui-base/yui-base-min.js
  * /foo-1.2.3/bar/bar-min.js

## Serving static assets from CDN

If you plan to serve the build folder from CDN, then make sure you set that
before registering any group, so loader can know about it. Here is the example:

```
app.yui.setCoreFromCDN();
app.set('yui combo config', {
    comboBase: 'http://mycdn.com/path/to/combo?',
    comboSep: '&',
    maxURLLength: 1024
});
app.set('yui default base', 'http://mycdn.com/path/to/static/{{groupDir}}/');
app.set('yui default root', 'static/{{groupDir}}/');
app.yui.registerGroup('foo', 'path/to/foo-1.2.3'); // if you use locator, this is not needed
```

in which case you don't need to use `yui.static` middleware since you are not
serving local files.

With this configuration, a group called `foo` with version `1.2.3` will produce urls like these:

  * http://mycdn.com/path/to/combo?static/foo-1.2.3/bar/bar-min.js&static/foo-1.2.3/baz/baz-min.js
  * http://mycdn.com/path/to/static/foo-1.2.3/bar/bar-min.js

API Docs
--------

You can find the [API Docs][] as under the `apidocs` folder in github, and you can browse it thru this url:

https://rawgithub.com/yahoo/express-yui/master/apidocs/

[API Docs]: https://github.com/yahoo/express-yui/tree/master/apidocs

License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/express-yui/blob/master/LICENSE.md


Contribute
----------

See the [CONTRIBUTE file][] for info.

[CONTRIBUTE file]: https://github.com/yahoo/express-yui/blob/master/CONTRIBUTE.md

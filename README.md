Express YUI
===========

[Express][] extension for [YUI][] applications.

[![Build Status](https://travis-ci.org/yahoo/express-yui.png?branch=master)][Build Status]


[Express]: https://github.com/visionmedia/express
[Build Status]: https://travis-ci.org/yahoo/express-yui
[YUI]: http://yuilibrary.com/


Goals & Design
--------------

This compontent extends express by adding a new `app.yui` member to the express
application. It is responsible for controlling and exposing both the yui
configuration and the application state on the client side as well has
controlling the yui instance on the server.


Installation
------------

Install using npm:

```shell
$ npm install express-yui
```


Features
--------

### Features

 * control yui config and seed modules per request.
 * provide basic configurations for cdn, debug, and other common conditions in yui.
 * provide middleware to serve `static` assets from origin server.
 * provide middleware to `expose` the app `state` object with the yui config and seed urls.

Usage
-----

### Extending express functionalities

`express-yui` is a conventional `express` extension, which means it will extend
the functionalities provided on `express` by augmenting the express app instance
with a new member called `yui`. At the same time, `express-yui` provides a set of
static methods that you can call directly off the `express-yui` module. These
methods include utility methods and express middleware.

Here is an example of how to extend an `express` app with `express-yui`:

```js
var express = require('express'),
    expyui = require('express-yui'),
    app = express();

// extending the `express` app instance using extension pattern decribed here:
// https://gist.github.com/ericf/6133744
expyui.extend(app);

// using the new `yui` member off the app instance
app.yui.applyConfig({ fetchCSS: false });
```

As you can see in the example above, the `yui` member is available off the app
instance after extending the `express` app.


### Exposing app state into client

To expose the state of the app (which includes the computed yui configuration
based on the configuration defined through the express app instance), you can
call the `expose` middleware for any particular route:

```js
var express = require('express'),
    expyui = require('express-yui'),
    app = express();

expyui.extend(app);

app.get('/foo', expyui.expose(), function (req, res, next) {
    res.render('foo');
});
```

By doing `expyui.expose()`, `express-yui` will provision a property called `state` that
can be used in your templates as a javascript blob that sets up the page to run
YUI with some very specific settings coming from the server. If you use `handlebars`
you will do this:

```html
<script>{{{state}}}</script>
<script>
app.yui.ready(function () {
    // you can use YUI now
});
</script>
```

And this is really the only thing you need to do in your templates to get YUI ready to roll!

**Note:** In order to be efficient by default, once the first request comes in
the `expose()` middleware will cache the state of the YUI config for the app.
This means if it needs to be mutated on a per-request basies, it must be re-exposed.


### Using the locator plugin to build the app

`express-yui` provides many features, but the real power of this package can be seen when
using it in conjunction with the [locator][] component and the [locator-yui][] plugin.

[locator]: https://github.com/yahoo/locator
[locator-yui]: https://github.com/yahoo/locator-yui

```js
var express = require('express'),
    expyui = require('express-yui'),
    LocatorClass = require('locator'),
    LocatorYUI = require('locator-yui'),
    app = express(),
    loc = new LocatorClass({
        buildDirectory: __dirname + '/build'
    });

// mounting `locator` instance
app.set('locator', loc);

// extending app with `express-yui`
expyui.extend(app);

// serving static yui modules built by locator
app.use(expyui.static(__dirname + '/build'));

app.get('/foo', expyui.expose(), function (req, res, next) {
    res.render('foo');
});

// adding plugins to locator to support different type of files
loc.plug(new LocatorYUI());

// triggering locator filesystem abstraction
loc.parseBundle(__dirname, {});

app.yui.ready(function (err) {
    if (err) {
        throw err;
    }
    // if everything was ready, we can start listening for traffic
    app.listen(8080);
});
```

As a result, any yui module under the `__dirname` folder or any npm dependency marked as
a locator bundle will be built by the `locator-yui` plugin, and become automatically
available on the client, and potentially on the server as well. This means you
no longer need to manually define loader metadata or any kind of yui config to load those
modules, and `express-yui` will be capable to handle almost everthing for you.


### Using yui modules on the server side

Using modules on the server is exactly the same that using them on the client thru
`app.yui.use()` statement. Here is an example of the use of yql module to load the
weather forecast and passing the result into the template:

```js
app.get('/forecast', expyui.expose(), function (req, res, next) {
    req.app.yui.use('yql', function (Y) {
        Y.YQL('select * from weather.forecast where location=90210', function(r) {
            // r contains the result of the YQL Query
            res.render('forecast', {
                result: r
            });
        });
    });
});
```

_note: remember that `req.app` holds a reference to the `app` object for convenience._

### Using [Locator] plugins

If you use `locator` and `express-view` components in conjuction with some
other [locator][] plugins like `locator-handlebars` and `locator-yui` to
precompile templates, and shift yui modules, then when calling
`res.render('foo')` and `express-view` will resolve `foo` automatically based
on the precompiled version. Check this example to see this in action:

 * https://github.com/yahoo/express-yui/tree/master/examples/locator-express

### Serving static assets from app origin

Ideally, you will use a CDN to serve all static assets for your application, but your
express app is perfectly capable to do so, and even serve as origin server for your CDN.

```js
app.yui.setCoreFromAppOrigin();
app.use(expyui.static(__dirname + '/build'));
```

With this configuration, a group called `foo` with version `1.2.3`, and `yui`
version `3.11.0`, it will produce urls like these:

  * /yui-3.11.0/yui-base/yui-base-min.js
  * /foo-1.2.3/bar/bar-min.js

Any of those urls will be valid because `express-yui` static method produces an express app
that can be mounted under your express application to serve yui core modules and application
specific modules (modules compiled by [locator][] into the `build` folder).

### Serving static assets from CDN

If you plan to serve the locator-generated `build` folder from your CDN, then make
sure you set the proper configuration for all groups so loader can know about them.

Here is the example:

```js
app.set('yui default base', 'http://mycdn.com/path/to/build/');
app.set('yui combo config', {
    comboBase: 'http://mycdn.com/path/to/combo?',
    comboSep: '&',
    maxURLLength: 1024
});
app.set('yui default root', 'build/');
```

In this case you don't need to use `expyui.static()` middleware since you are not
serving local files, unless the app should work as origin server.

With this configuration, a group called `foo` with version `1.2.3` will produce urls like these:

  * http://mycdn.com/path/to/combo?build/foo-1.2.3/bar/bar-min.js&build/foo-1.2.3/baz/baz-min.js
  * http://mycdn.com/path/to/build/foo-1.2.3/bar/bar-min.js


API Docs
--------

You can find the [API Docs][] under `apidocs` folder, and you can browse it thru this url:

* http://rawgithub.com/yahoo/express-yui/master/apidocs/index.html

[API Docs]: https://github.com/yahoo/express-yui/tree/master/apidocs


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/express-yui/blob/master/LICENSE.md


Contribute
----------

See the [CONTRIBUTING file][] for info.

[CONTRIBUTING file]: https://github.com/yahoo/express-yui/blob/master/CONTRIBUTING.md

Express YUI
===========

[Express][] extension for YUI Applications.

[![Build Status](https://travis-ci.org/yahoo/express-yui.png?branch=master)][Build Status]


[Express]: https://github.com/visionmedia/express
[Build Status]: https://travis-ci.org/yahoo/express-yui


Goals & Design
--------------

This compontent extends express by adding a new member `app.yui` to the
express application. It is responsible for controlling and exposing the yui
configuration and the app state into the client side as well has controlling
the yui instance on the server.


Installation
------------

Install using npm:

```shell
$ npm install express-yui
```


Features
--------

### Features

 * expose yui config and seed files per request
 * provide basic configurations for cdn, debug, and other common conditions in yui
 * provide middleware to serve `static` assets from origin server, including
combo capabilities built-in.
 * provide middleware to `expose` the app state and the yui config into the
 view engine to be used in the templates to boot YUI and the app in the client side.


### Other features

 * built-in integration with [locator][] component to analyze and build applications and dependencies using [shifter][].
 * provide basic express view engine to rely on views registered at the server side thru the `app.yui.use()` as compiled templates.

[locator]: https://github.com/yahoo/locator
[shifter]: https://github.com/yui/shifter


Usage
-----

### Extending express functionalities

`express-yui` is a conventional `express` extension, which means it will extend
the functionalities provided on `express` by augmenting the express app instance
with a new member called `yui`. At the same time, `express-yui` provides a set of
static methods that you can call directly off the `express-yui` module, those
methods are utility methods and express middleware.

Here is an example of how to extend an `express` app with `express-yui`:

```
var express = require('express'),
    expyui = require('express-yui'),
    app = express();

// calling a static method to extend the `express` app instance
expyui.extend(app);
// using the new `yui` member off the app instance
app.yui.applyConfig({ fetchCSS: false });
```

As you can see in the example above, the `yui` member is available off the app instance after extending the `express` app.


### Exposing app state into client

To expose the state of the app, which includes the yui configuration computed based
on the configuration defined thru the express app instance, you can call the `expose`
middleware for any particular route:

```
var expyui = require('express-yui'),
    express = require('express'),
    app = express();

expyui.extend(app);
app.get('/foo', expyui.expose(), function (req, res, next) {
    res.render('foo');
});
```

By doing `expyui.expose()`, `express-yui` will provision a property call `state` that
can be use in your templates as a `javascript` blob that sets up the page to run
YUI with some very specific settings coming from the server. If you use `handlebars`
you will do this:

```
<script>{{{state}}}</script>
<script>
app.yui.use('node', function (Y) {
    Y.one('body').setContent('<p>Ready!</p>');
});
</script>
```

And this is really the only thing you should do in your templates to get YUI ready to roll!


### Using the locator plugin to build the app

`express-yui` provides many features, but the real power of this package can be seen when
using it in conjunction with [locator][] component.

```
var express = require('express'),
    expyui = require('express-yui'),
    app = express();

expyui.extend(app);

// serving static yui modules built by locator
app.use(expyui.static());

app.get('/foo', expyui.expose(), function (req, res, next) {
    res.render('foo');
});

// using locator to analyze the app and its dependencies
new (require('locator'))({
    buildDirectory: 'build'
}).plug(app.yui.plugin({
    // provision any yui module to be available on the client side
    registerGroup: true,
    // only needed if you want yui modules available on the server runtime as well
    registerServerModules: true
})).parseBundle(__dirname, {});

app.listen(8080);
```

As a result, any yui module under `__dirname` folder or any npm dependency marked as
a locator bundle will be built by the `express-yui`'s locator plugin, and automatically
become available on the client, and potentially on the server as well. This means you
no longer need to manually define loader metadata or any kind of yui config to load those
modules, and `express-yui` will be capable to handle almost everthing for you.


### Using yui modules on the server side

Using modules on the server is exactly the same that using them on the client thru
`app.yui.use()` statement. Here is an example of the use of yql module to load the
weather forecast and passing the result into the template:

```
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


### Using Y.Template on the server side

`express-yui` ships with a custom `express` view class implementation which allows to control `res.render()` calls. Normally, `express` along with some specific view engine can do the work of compiling and rendering templates on the server side, but `express-yui` is striking for bringing parity between server and client, and for that, it supports the use of compiled-to-javascript templates that can be used on the server and client alike.

For that, you just need to hook `app.yui.view()` into express, by doing this:

```
app.set('view', app.yui.view());
```

With the code above, there is not need to define anything else in express in terms of engine, or path to views, or anything else, all that is irrelevant since `express-yui` will completely take over the `express`'s template resolution process, and will drive it thru `Y.Template`, which means you can call `res.render('foo')` in your middleware, and `express-yui` will resolve `foo` template. `express-yui` will try to find `foo` template within the `Y.Template` internal cache, and call for render if the exists.

#### Layout

You can also define a default layout:

```
app.set('view', app.yui.view({
    defaultLayout: 'bar'
}));
```

If you use `defaultLayout` as above, or just by providing the `layout` value when calling `res.render('foo', { layout: 'bar' })`, `express-yui` will resolve the `view`, render it, and the result of that operation will be passed into the layout render thru a context variable called `outlet`, this is similar to `emberjs`. In a handlebars template, you will define the `outlet` like this:

```
<div>{{{outlet}}}</div>
```

#### Bundle (optional)

If your templates are part of a NPM dependency, you have to tell `express-yui` and the `view` how to resolve those templates from a different package, for that, you can define `defaultBundle`:

```
app.set('view', app.yui.view({
    defaultBundle: 'name-of-package-with-templates'
}));
```

If you use `defaultBundle` as above, or just by providing the `bundle` value when calling `res.render('foo', { bundle: 'name-of-package-with-templates' })`, `express-yui` will lookup for the template under the specified bundle. Internally, all templates will be prefixed with the package name of their corresponding NPM package, and the `bundle` will be used to specify what prefix to use.

### Using [Locator] plugins

If you use `locator` component plus other plugins like `locator-handlebars` to precompile templates into YUI Modules, then when calling `res.render('foo')`, `express-yui` can resolve `foo` automatically based on the compiled version. Check this example to see `app.yui.view()` in action:

 * https://github.com/yahoo/express-yui/tree/master/examples/locator-express

More information about this new feature in express here:

 * http://caridy.name/blog/2013/05/bending-express-to-support-synthetic-views/


### Registering yui groups manually


If you are not using [locator][] component for whatever reason, you will be responsible
for building yui modules, grouping them into yui groups and registering them thru
`app.yui.registerGroup` method. Here is how you register a folder that has the build
result with all yui modules compiled thru [shifter][]:

```
app.yui.registerGroup('foo', 'path/to/foo-1.2.3');
```

Again, this is absolutely not needed if you use [locator][].

### Serving static assets from app origin

Ideally, you will use a CDN to serve all static assets for your application, but your
express app is perfectly capable to do so, and even serve as origin server for your CDN.

```
app.yui.setCoreFromAppOrigin();
app.use(expyui.static());
```

With this configuration, a group called `foo` with version `1.2.3`, and `yui` version `3.11.0`, it will produce urls like these:

  * /combo~/yui-3.11.0/yui-base/yui-base-min.js~/foo-1.2.3/bar/bar-min.js~/foo-1.2.3/baz/baz-min.js
  * /yui-3.11.0/yui-base/yui-base-min.js
  * /foo-1.2.3/bar/bar-min.js

Any of those urls will be valid because `express-yui` static middleware will serve them and
combo them when needed based on the configuration of yui.

### Serving static assets from CDN

If you plan to serve the `build` folder, generated by [locator][], from your CDN, then make
sure you set the proper configuration for all groups so loader can know about them.
Here is the example:

```
app.set('yui combo config', {
    comboBase: 'http://mycdn.com/path/to/combo?',
    comboSep: '&',
    maxURLLength: 1024
});
app.set('yui default base', 'http://mycdn.com/path/to/static/{{groupDir}}/');
app.set('yui default root', 'static/{{groupDir}}/');
```

In this case you don't need to use `expyui.static` middleware since you are not
serving local files, unless the app should work as origin server.

With this configuration, a group called `foo` with version `1.2.3` will produce urls like these:

  * http://mycdn.com/path/to/combo?static/foo-1.2.3/bar/bar-min.js&static/foo-1.2.3/baz/baz-min.js
  * http://mycdn.com/path/to/static/foo-1.2.3/bar/bar-min.js


### CSS modules and assets

You can get `express-yui` to compile yui css modules as well, for that, you need to use a json file that describe how to locate and build the css modules. This is the same technique we use in `yui` to build css modules. Here is an example of such as file (build.json):

```
{
    "name": "styles",
    "builds": {
        "cssdemo": {
            "cssfiles": [
                "demo.css"
            ],
            "config": {
                "type": "css"
            }
        }
    }
}
```

Aside from that, there are a couple of things you need to keep in mind about yui css modules:

* `cssfiles` from the example above are relative to a `css` folder that is located at the same level than `build.json`.
* YUI css modules can contain assets (usually located under the `assets` folder at the same level), but if you use a combo, then the path for those assets will not resolve correctly. More info about this problem [here](https://github.com/davglass/cssproc#css-relative-url-processor). To solve this you can enable `cssproc` configuration when you plug the plugin:

```
locatorObj.plug(app.yui.plugin({
    cssproc: true
}));
```

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

See the [CONTRIBUTE file][] for info.

[CONTRIBUTE file]: https://github.com/yahoo/express-yui/blob/master/CONTRIBUTE.md

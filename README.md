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


Usage
-----

## Features

 * expose `yui_config` per request basis
 * expose seed files per request basis
 * provide basic configurations for cdn, debug, and other common conditions
 * extend express by adding `req.app.yui` object that holds all information about yui
 * provide basic middleware to server yui core and groups as static assets
 * provide basic middleware to expose `yui_config` and `yui_seed` into the view engine
 * provide basic express engine to rely on the Y instance computed as the server side
to resolve compiled templates.

## Other features

 * serve yui core modules from app origin
 * serve loader group with app modules from app origin

API
---


License
-------

This software is free to use under the Yahoo! Inc. BSD license.
See the [LICENSE file][] for license text and copyright information.

[LICENSE file]: https://github.com/yahoo/express-yui/blob/master/LICENSE


Dependencies
------------

This npm package requires `modown-static` which is still in development and not
yet published in NPM registry.

Contribute
----------

See the [CONTRIBUTE file][] for info.

[CONTRIBUTE file]: https://github.com/yahoo/express-yui/blob/master/CONTRIBUTE

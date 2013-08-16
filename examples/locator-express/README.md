What is this example?
---------------------

This examples demonstrate how to use `express-yui` with `locator` in an express application. It also demonstrate how to use `locator-handlebars` and `locator-micro` plugins to compile templates to YUI modules as well as the use of app level yui modules (e.g: `binder-index` and `alerts-model`).


How does it work?
-----------------

There are 3 templates in this example, `templates/bar.handlebars`, `templates/foo.micro` and `templates/layouts/index.handlebars`. They work together to form a composite view where `bar` and `foo` will be inserted within a `div` in `layout`'s `outlet` entry. This demonstrate how `express-yui` is template engine agnostic.

When the page gets rendered on the client side, the `app` can use yui to load modules `alerts-model` and `binder-index` (which also load a compiled version of template `bar`), and call for render, producing a html fragment that will be inserted in the DOM under `content` element.


How to test this app?
---------------------

Make sure you install the `express-yui` component first by doing `npm  i` on the root folder of this repository, then run the express application:

```
node app.js
```

Then navigate to any of the following urls:

* `http://localhost:3000/foo`
* `http://localhost:3000/bar`

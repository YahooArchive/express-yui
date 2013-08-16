What is this example?
---------------------

This examples demonstrate how to use `express-yui` with `locator` in an express application to manage css in a form of yui css modules.

It also shows how to use assets in those css files that will be compiled and will be available thru a combo url, in which case the path to the assets has to be absolute.

All this is possible because `express-yui` uses `shifter`, which uses `cssproc` to pre-process those css modules to correct any url for any asset within the css rules.


How does it work?
-----------------

It uses a json file `css/build.json` to describe how to build yui css modules based on some css files. These modules will be available thru `Y.use()` or could be used to generate urls to load the css modules at the top of the page in the `head` section.


How to test this app?
---------------------

Make sure you install the `express-yui` component first by doing `npm  i` on the root folder of this repository, then run the express application:

```
node app.js
```

Then navigate to any of the following urls:

* `http://localhost:3000/`

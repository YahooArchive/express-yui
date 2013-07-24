Contributing Code to `express-yui`
----------------------------------

This components follows the same contribution model used by [Mojito][], you can
review the [Contributing-Code-to-Mojito file][] for more details.

Please be sure to sign our [CLA][] before you submit pull requests or otherwise contribute to `express-yui`. This protects `express-yui` developers, who rely on [express-yui's BSD license][].

[express-yui's BSD license]: https://github.com/yahoo/express-yui/blob/master/LICENSE.md
[CLA]: http://developer.yahoo.com/cocktails/mojito/cla/
[Mojito]: https://github.com/yahoo/mojito
[Contributing-Code-to-Mojito file]: https://github.com/yahoo/mojito/wiki/Contributing-Code-to-Mojito

Dev mode installation
---------------------

- The main source files are located under `lib/`.
- Unit tests are located under `tests/units/*`.
- Examples are located under `examples/`.

To install the dependencies:

    npm install

To run the unit tests (with coverage by default):

    npm test

To generate the API docs under `apidocs/index.html`:

    npm run docs

To lint the app lib folder:

    npm run lint
    
Release checklist
-----------------

* verify that [HISTORY.md] is updated
* verify that [README.md] is updated
* bump the version in [package.json]
* commit to master
* push to npm using `npm publish`
* create a [new release] entry including the tag for the new version

If is also important to verify that whatever we pushed to npm is working as expected, to do that, do this:

```
cd examples/locator-express
rm -rf build node_modules
npm install
node app.js
```

then navigate to [http://localhost:3000/foo](http://localhost:3000/foo) to do some sanity checks on the release.

[HISTORY.md]: https://github.com/yahoo/express-yui/blob/master/HISTORY.md
[README.md]: https://github.com/yahoo/express-yui/blob/master/README.md
[package.json]: https://github.com/yahoo/express-yui/blob/master/package.json
[new release]: https://github.com/yahoo/express-yui/releases/new

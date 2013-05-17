## Contributing Code to `express-yui`

- The main source files are located under `lib/`.
- Unit tests are located under `tests/units/*`.
- Examples are located under `examples/`.

To install the dependencies:

    npm install

To run the unit tests (with coverage by default):

    npm test

To generate the API docs under `build/apidocs/index.html`:

    rm -rf ./build/apidocs && mkdir -p ./build/apidocs
    npm run docs

To lint the app lib folder:

    npm run lint
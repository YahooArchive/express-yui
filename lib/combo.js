    // SOME routines from rgrove/combohandler repo
    fs      = require('fs'),
    path    = require('path'),
    util    = require('util'),

    // Default set of MIME types supported by the combo handler. Attempts to
    // combine one or more files with an extension not in this mapping (or not
    // in a custom mapping) will result in a 400 response.
    MIME_TYPES = exports.MIME_TYPES = {
        '.css' : 'text/css',
        '.js'  : 'application/javascript',
        '.json': 'application/json',
        '.txt' : 'text/plain',
        '.xml' : 'application/xml'
    };


// BadRequest is used for all filesystem-related errors, including when a
// requested file can't be found (a NotFound error wouldn't be appropriate in
// that case since the route itself exists; it's the request that's at fault).
function BadRequest(message) {
    Error.call(this);
    this.name = 'BadRequest';
    this.message = message;
    Error.captureStackTrace(this, arguments.callee);
}
util.inherits(BadRequest, Error);
exports.BadRequest = BadRequest; // exported to allow instanceof checks

// -- Private Methods ----------------------------------------------------------

function getExtName(filename) {
    return path.extname(filename).toLowerCase();
}

function getFileTypes(files) {
    return dedupe(files.map(getExtName));
}

function combine(config) {
    var maxAge    = config.maxAge,
        mimeTypes = config.mimeTypes || MIME_TYPES;

    if (typeof maxAge === 'undefined') {
        maxAge = 31536000; // one year in seconds
    }

    return function (files, callback) {
        var body    = [],
            pending = files.length,
            fileTypes = getFileTypes(files),
            // fileTypes array should always have one member, else error
            type    = fileTypes.length === 1 && mimeTypes[fileTypes[0]],
            lastModified;

        function finish() {
            var res = {
                header: {}
            };

            if (lastModified) {
                res.header['Last-Modified'] = lastModified.toUTCString();
            }

            // http://code.google.com/speed/page-speed/docs/caching.html
            if (maxAge !== null) {
                res.header['Cache-Control'] = 'public,max-age=' + maxAge;
                res.header.Expires          = new Date(Date.now() + (maxAge * 1000)).toUTCString();
            }

            res.header['Content-Type'] = (type || 'text/plain') + ';charset=utf-8';
            res.body = body.join('\n');

            callback(null, res);
        }

        if (!pending) {
            // No files requested.
            return callback(new BadRequest('No files requested.'));
        }

        if (!type) {
            if (fileTypes.indexOf('') > -1) {
                // Most likely a malformed URL, which will just cause
                // an exception later. Short-cut to the inevitable conclusion.
                return callback(new BadRequest('Truncated url.'));
            } else if (fileTypes.length === 1) {
                // unmapped type found
                return callback(new BadRequest('Illegal MIME type present.'));
            } else {
                // A request may only have one MIME type
                return callback(new BadRequest('Only one MIME type allowed per request.'));
            }
        }

        files.forEach(function (absolutePath, i) {
            // Skip empty parameters.
            if (!absolutePath) {
                pending -= 1;
                return;
            }

            fs.stat(absolutePath, function (err, stats) {
                if (err || !stats.isFile()) {
                    return callback(new BadRequest('File not found: ' + absolutePath));
                }

                var mtime = new Date(stats.mtime);

                if (!lastModified || mtime > lastModified) {
                    lastModified = mtime;
                }

                fs.readFile(absolutePath, 'utf8', function (err, data) {
                    if (err) { return callback(new BadRequest('Error reading file: ' + absolutePath)); }

                    body[i]  = data;
                    pending -= 1;

                    if (pending === 0) {
                        finish();
                    }
                }); // fs.readFile
            }); // fs.stat
        }); // forEach
    };
}
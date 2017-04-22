var fs = require('fs');
var Promise = require('bluebird');

function StateFile(path) {
    this.path = path;
}

/**
 * A method for loading state. This method will be called with only one
 * argument; a callback.
 *
 * The callback is a standard node.js callback, that takes an error as the first
 * argument, and the loaded state as the second argument. The state must be
 * returned as a plain javascript object.
 */
StateFile.prototype.load = function (cb) {
    var readFile = Promise.promisify(fs.readFile, { context: fs });
    return readFile(this.path, 'utf8')
      .then(function (text) {
          return JSON.parse(text);
      }).asCallback(cb);
};

/**
 * A method for saving state. This method will be called with two arguments.
 *
 * - an object with the state that will need to be persisted.
 * - a callback
 *
 * The callback takes an error as the only argument.
 */
StateFile.prototype.save = function (state, cb) {
    var json = JSON.stringify(state);
    var writeFile = Promise.promisify(fs.writeFile, { context: fs });
    return writeFile(this.path, json).asCallback(cb);
};

module.exports = StateFile;

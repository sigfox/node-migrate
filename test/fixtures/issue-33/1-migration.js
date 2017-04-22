
var db = require('../db');

exports.up = function () {
  db.issue33.push('1-up');
};

exports.down = function () {
  db.issue33.push('1-down');
};

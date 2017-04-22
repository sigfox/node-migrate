
var db = require('../db');

exports.up = function () {
  db.issue33.push('2-up');
};

exports.down = function () {
  db.issue33.push('2-down');
};

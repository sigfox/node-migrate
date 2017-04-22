
var db = require('../db');

exports.up = async function () {
  db.pets.push({ name: 'tobi' });
  db.pets.push({ name: 'loki' });
};

exports.down = async function () {
  db.pets.pop();
  db.pets.pop();
};

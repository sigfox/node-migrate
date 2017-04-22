
var db = require('../db');

exports.up = function () {
  db.pets.forEach(function (pet) {
    pet.email = pet.name + '@learnboost.com';
  });
};

exports.down = function () {
  db.pets.forEach(function (pet) {
    delete pet.email;
  });
};

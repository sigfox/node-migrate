
/*!
 * migrate - Set
 * Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , Migration = require('./migration')
  , StateFile = require('./stateFile')
  , fs = require('fs')
  , Promise = require('bluebird');

/**
 * Expose `Set`.
 */

module.exports = Set;

/**
 * Initialize a new migration `Set` with the given `path` which is used to store
 * data between migrations. Alternatively you can provide an implementation
 * similar to the StateFile class that will persist the state between migrations
 * in another way.
 *
 * @param {String} path | {State}
 * @param {Object} db
 * @api private
 */

function Set(state, db) {
  if (typeof state === 'string') {
    this.state = new StateFile(state);
  } else {
    this.state = state;
  }

  this.migrations = [];
  this.pos = 0;
  this.db = db;
};

/**
 * Inherit from `EventEmitter.prototype`.
 */

Set.prototype.__proto__ = EventEmitter.prototype;

/**
 * Add a migration.
 *
 * @param {String} title
 * @param {Function} up
 * @param {Function} down
 * @api public
 */

Set.prototype.addMigration = function(title, up, down){
  this.migrations.push(new Migration(title, up, down));
};

/**
 * Save the migration data.
 *
 * @param {String} migration
 * @param {String} direction
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

Set.prototype.save = function(migration, direction, fn){
  var self = this;
  return Promise.resolve(this.state.save({
    pos: self.pos,
    title: migration.title,
    direction: direction
  }))
  .then(function () {
    self.emit('save')
  }).asCallback(fn);
};

/**
 * Load the migration data and call `fn(err, obj)`.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

Set.prototype.load = function(fn){
  this.emit('load');
  return Promise.resolve(this.state.load()).asCallback(fn);
};

/**
 * Run down migrations and call `fn(err)`.
 *
 * @param {String} migrationName
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

Set.prototype.down = function(migrationName, fn){
  return this.migrate('down', migrationName).asCallback(fn);
};

/**
 * Run up migrations and call `fn(err)`.
 *
 * @param {String} migrationName
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

Set.prototype.up = function(migrationName, fn){
  return this.migrate('up', migrationName).asCallback(fn);
};

/**
 * Migrate in the given `direction`, calling `fn(err)`.
 *
 * @param {String} direction
 * @param {String} migrationName
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

Set.prototype.migrate = function(direction, migrationName, fn){
  if (typeof migrationName === 'function') {
    fn = migrationName;
    migrationName = null;
  }
  var self = this;
  return this.load()
    .then(function(obj){
      self.pos = obj.pos;
      return self._migrate(direction, migrationName);
    })
    .catch(function(err){
      if ('ENOENT' !== err.code) throw err;
      return self._migrate(direction, migrationName);
    }).asCallback(fn);
};

/**
 * Get index of given migration in list of migrations
 *
 * @api private
 */

 function positionOfMigration(migrations, filename) {
   for(var i=0; i < migrations.length; ++i) {
     if (migrations[i].title == filename) return i;
   }
   return -1;
 }

/**
 * Perform migration.
 *
 * @param {String} direction
 * @param {String} migrationName
 * @param {Function} fn
 * @return {Promise}
 * @api private
 */

Set.prototype._migrate = function(direction, migrationName){
  var self = this
    , migrations
    , migrationPos;

  if (!migrationName) {
    migrationPos = direction == 'up' ? this.migrations.length : 0;
  } else if ((migrationPos = positionOfMigration(this.migrations, migrationName)) == -1) {
    return fn(new Error("Could not find migration: " + migrationName));
  }

  switch (direction) {
    case 'up':
      migrations = this.migrations.slice(this.pos, migrationPos+1);
      break;
    case 'down':
      migrations = this.migrations.slice(migrationPos, this.pos).reverse();
      break;
  }

  function next(migration) {
    if (!migration) return Promise.resolve(null);

    self.emit('migration', migration, direction);
    var migrate = migration[direction](self.db);
    return Promise.resolve(migrate)
      .then(function(){
        self.pos += (direction === 'up' ? 1 : -1);
        return self.save(migration, direction)
      })
      .then(function () {
        return next(migrations.shift())
      });

  }

  return next(migrations.shift());
};

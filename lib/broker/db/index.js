'use strict';
var Logule = require('logule');
var sqlserver = require('./sqlserver');

var Database = function(opts) {
  var db = new sqlserver(opts);

  db.instanceTableName = 'instances';
  db.bindingTableName = 'bindings';
  db.log = Logule.init(module, db.name);
  return db;
};

module.exports = Database;

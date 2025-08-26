const { createDBconnection } = require('./database');

// used for mocking database to test 
// comment for testing 
db = createDBconnection('./database/geiger.db');

// uncomment for testing
// db = createDBconnection(':memory:');

module.exports = db;

const sqlite = require('sqlite3');

// TODO: fix all the insert in the device because all deviceID is auto increase

module.exports.createDBconnection = (filePath) => {
    // uncomment memory to test
    const db = new sqlite.Database(filePath, (err) => {
        if (err) {
            console.error('Error opening database:', err.message);
        } else {
            console.log('Connected to the SQLite database.');
        }
    });

    db.serialize(() => {
        db.run(`
        CREATE TABLE IF NOT EXISTS device (
          deviceID INTEGER PRIMARY KEY AUTOINCREMENT,
          deviceName TEXT UNIQUE,
          deviceType TEXT
        )
      `);
        db.run(`
        CREATE TABLE IF NOT EXISTS record (
          deviceID INTEGER,
          timeStamp DATETIME,
          Cps REAL,
          uSv REAL,
          PRIMARY KEY (deviceID, timeStamp),
          FOREIGN KEY (deviceID) REFERENCES device(deviceID)
        )
      `);
    });

    return db;
}

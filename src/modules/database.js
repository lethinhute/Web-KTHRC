const sqlite = require('sqlite3');

module.exports.createDBconnection = (filePath) => {
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
          deviceID INTEGER PRIMARY KEY,
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

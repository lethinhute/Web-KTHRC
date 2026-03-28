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
          createdAt INTEGER,
          lastSeen INTEGER
        )
      `);

        // Backward-compatible migration for existing databases created before metadata columns.
        db.run("ALTER TABLE device ADD COLUMN createdAt INTEGER", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Failed to add createdAt column:', err.message);
            }
        });
        db.run("ALTER TABLE device ADD COLUMN lastSeen INTEGER", (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Failed to add lastSeen column:', err.message);
            }
        });

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

        // Indexes keep latest-data and range queries fast as device count grows.
        db.run('CREATE INDEX IF NOT EXISTS idx_record_timeStamp ON record(timeStamp)');
        db.run('CREATE INDEX IF NOT EXISTS idx_record_device_time ON record(deviceID, timeStamp)');
    });

    return db;
}

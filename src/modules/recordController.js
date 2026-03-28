const { query } = require('express');
const db = require('./databaseInit')

// post -> /record
// Devices auto-register on first POST: deviceID is the hardware-assigned ID.
module.exports.createRecord = async (req, res) => {
    const { deviceID, timeStamp, Cps, uSv, deviceType } = req.body;
    if (!deviceID || !timeStamp || !Cps || !uSv) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // Auto-register the device on first contact using its hardware ID.
    // INSERT OR IGNORE skips already-known devices so their existing data is preserved.
    db.run("INSERT OR IGNORE INTO device (deviceID, deviceType) VALUES (?, ?)", [deviceID, deviceType || null], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to register device' });
        }
        const stmt = db.prepare("INSERT INTO record (deviceID, timeStamp, Cps, uSv) VALUES (?, ?, ?, ?)");
        stmt.run(deviceID, timeStamp, Cps, uSv, function(err) {
            if (err) {
                return res.status(500).json({ error: 'Failed to add record' });
            }
            res.status(201).json({ deviceID, timeStamp, Cps, uSv });
        });
        stmt.finalize();
    });
}

module.exports.getRecords = async (req, res) => {

    const { deviceID, day, month, year, Cps, uSv } = req.query;

    db.all("SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv FROM record r", (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ error: 'No records yet...' });
        }

        if (deviceID) {
            rows = rows.filter(row => row.deviceID == deviceID);
        }

        if (day) {
            rows = rows.filter(row => (new Date(row.timeStamp * 1000)).getDate() == day);
        }

        // get month return month from 0 so we plus 1 
        if (month) {
            rows = rows.filter(row => (new Date(row.timeStamp * 1000)).getMonth() + 1 == month);
        }

        if (year) {
            rows = rows.filter(row => (new Date(row.timeStamp * 1000)).getFullYear() == year);
        }

        if (Cps) {
            rows = rows.filter(row => row.Cps == Cps);
        }

        if (uSv) {
            rows = rows.filter(row => row.uSv == uSv);
        }

        if (rows.length == 0) {
            return res.status(404).json({ error: 'Record with specified parameters not found!' })
        }

        res.status(200).json(rows);
    });
}

// get -> /records/:deviceID
module.exports.getRecordsByID = async (req, res) => {
    const { deviceID } = req.params;
    queryStr = "SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv FROM record WHERE deviceID = ?"
    db.all(queryStr, [deviceID], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(404).json({ error: 'No records found for this device' });
        }
        res.status(200).json(rows);
    });
};

// Delete a record by deviceID and timestamp 
// TODO: not practical, just here for proof of concept
// must do a delete by year, month, day, hours or last 1-5 hours, last 1-5 minutes
// or chose from a query
module.exports.deleteRecordByIDTimeStamp = (req, res) => {
    const { deviceID, timeStamp } = req.params;
    db.run("DELETE FROM record WHERE deviceID = ? AND timeStamp = ?", [deviceID, timeStamp], function(err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.status(200).json({ message: 'Record deleted successfully' });
    });
};


module.exports.deleteRecordByDate = (req, res) => {
    const { deviceID, day, month, year } = req.query;
    if (!year) {
        return res.status(500).json({ error: "The delete record query must specifies in a single year!" });
    }
    if (!deviceID) {
        return res.status(500).json({ error: "The delete record query must have a deviceID" });
    }

    queryStr = "DELETE FROM record WHERE deviceID = ? AND strftime('%Y', timestamp) = ? ";
    if (month) {
        queryStr += "AND strftime('%m', timestamp) = ? "
    }

    if (day) {
        queryStr += "AND strftime('%e', timestamp) = ?"
    }

    db.run(queryStr, [deviceID, day, month, year], function(err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.status(200).json({ message: 'Record deleted successfully' });
    });
}

module.exports.getNewestRecord = (req, res) => {
    const { deviceID } = req.query;
    if (!deviceID) {
        return res.status(400).json({ error: 'Must specify deviceID' });
    }
    const queryStr =
        'SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv ' +
        'FROM record r ' +
        'WHERE r.deviceID = ? ' +
        'AND r.timeStamp = (SELECT MAX(r1.timeStamp) FROM record r1 WHERE r1.deviceID = ?)';
    db.all(queryStr, [deviceID, deviceID], function(err, rows) {
        if (err || rows.length === 0) {
            return res.status(404).json({ error: 'No record found for the specified deviceID' });
        }
        return res.status(200).json(rows);
    });
};

module.exports.getRangeRecord = (req, res) => {
    const { deviceID, from, to } = req.query;
    if (!deviceID || !from || !to) {
        return res.status(400).json({ error: 'Must specify deviceID, from, and to (Unix timestamps)' });
    }
    const queryStr =
        'SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv ' +
        'FROM record r ' +
        'WHERE r.deviceID = ? AND r.timeStamp BETWEEN ? AND ? ' +
        'ORDER BY r.timeStamp ASC';
    db.all(queryStr, [deviceID, from, to], function(err, rows) {
        if (err || rows.length === 0) {
            return res.status(404).json({ error: 'No records found in the specified range' });
        }
        return res.status(200).json(rows);
    });
}

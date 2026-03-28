const db = require('./databaseInit')

function pickFirstDefined(obj, keys) {
    for (const key of keys) {
        if (obj[key] !== undefined && obj[key] !== null) {
            return obj[key];
        }
    }
    return undefined;
}

function parseNumericField(raw, fieldName) {
    if (raw === undefined || raw === null) {
        return { ok: false, error: `${fieldName} is required` };
    }

    const parsed = Number(typeof raw === 'string' ? raw.trim() : raw);
    if (!Number.isFinite(parsed)) {
        return { ok: false, error: `${fieldName} must be numeric` };
    }

    return { ok: true, value: parsed };
}

// post -> /record
// Devices auto-register on first POST: deviceID is the hardware-assigned ID.
module.exports.createRecord = async (req, res) => {
    const rawDeviceID = pickFirstDefined(req.body, ['deviceID', 'deviceId', 'id']);
    const rawTimeStamp = pickFirstDefined(req.body, ['timeStamp', 'timestamp', 'time']);
    const rawCps = pickFirstDefined(req.body, ['Cps', 'cps']);
    const rawUSv = pickFirstDefined(req.body, ['uSv', 'usv', 'uSvh', 'usvh']);

    const deviceIDResult = parseNumericField(rawDeviceID, 'deviceID');
    const timeStampResult = parseNumericField(rawTimeStamp, 'timeStamp');
    const cpsResult = parseNumericField(rawCps, 'Cps');
    const uSvResult = parseNumericField(rawUSv, 'uSv');

    const errors = [deviceIDResult, timeStampResult, cpsResult, uSvResult]
        .filter((r) => !r.ok)
        .map((r) => r.error);
    if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', ') });
    }

    const parsedDeviceID = Math.trunc(deviceIDResult.value);
    let parsedTimeStamp = Math.trunc(timeStampResult.value);
    const parsedCps = cpsResult.value;
    const parsedUSv = uSvResult.value;

    // Accept Unix milliseconds from some firmware variants and normalize to seconds.
    if (parsedTimeStamp > 9999999999) {
        parsedTimeStamp = Math.trunc(parsedTimeStamp / 1000);
    }

    if (parsedDeviceID <= 0 || parsedTimeStamp <= 0) {
        return res.status(400).json({ error: 'deviceID and timeStamp must be positive numbers' });
    }

    // Auto-register the device on first contact using its hardware ID.
    // INSERT OR IGNORE skips already-known devices so their existing data is preserved.
    db.run(
        "INSERT OR IGNORE INTO device (deviceID, createdAt, lastSeen) VALUES (?, ?, ?)",
        [parsedDeviceID, parsedTimeStamp, parsedTimeStamp],
        (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to register device' });
        }
            db.run(
                "UPDATE device SET lastSeen = ? WHERE deviceID = ?",
                [parsedTimeStamp, parsedDeviceID],
                (updateErr) => {
                    if (updateErr) {
                        return res.status(500).json({ error: 'Failed to update device heartbeat' });
                    }

                    const stmt = db.prepare(
                        "INSERT INTO record (deviceID, timeStamp, Cps, uSv) VALUES (?, ?, ?, ?) " +
                        "ON CONFLICT(deviceID, timeStamp) DO UPDATE SET Cps = excluded.Cps, uSv = excluded.uSv"
                    );
                    stmt.run(parsedDeviceID, parsedTimeStamp, parsedCps, parsedUSv, function(insertErr) {
                        if (insertErr) {
                            return res.status(500).json({ error: 'Failed to add record' });
                        }
                        res.status(201).json({ deviceID: parsedDeviceID, timeStamp: parsedTimeStamp, Cps: parsedCps, uSv: parsedUSv });
                    });
                    stmt.finalize();
                }
            );
        }
    );
}

module.exports.getRecords = async (req, res) => {
    const { deviceID, day, month, year, Cps, uSv, startTime, endTime } = req.query;

    db.all("SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv FROM record r ORDER BY r.timeStamp ASC", (err, rows) => {
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

        if (startTime) {
            rows = rows.filter(row => row.timeStamp >= Number(startTime));
        }

        if (endTime) {
            rows = rows.filter(row => row.timeStamp <= Number(endTime));
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
    const queryStr = "SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv FROM record WHERE deviceID = ? ORDER BY r.timeStamp ASC"
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

    let queryStr = "DELETE FROM record WHERE deviceID = ? AND strftime('%Y', timestamp) = ? ";
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

// get -> /recordLatest?limit=50&deviceID=123
// Return newest records first, useful for real-time dashboards and dynamic device discovery.
module.exports.getLatestRecords = (req, res) => {
    const limitRaw = Number(req.query.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 500) : 50;
    const { deviceID } = req.query;

    let queryStr =
        'SELECT r.deviceID, r.timeStamp, r.Cps, r.uSv ' +
        'FROM record r ';
    const params = [];

    if (deviceID !== undefined) {
        queryStr += 'WHERE r.deviceID = ? ';
        params.push(Number(deviceID));
    }

    queryStr += 'ORDER BY r.timeStamp DESC LIMIT ?';
    params.push(limit);

    db.all(queryStr, params, (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch latest records' });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'No records yet...' });
        }
        return res.status(200).json(rows);
    });
};

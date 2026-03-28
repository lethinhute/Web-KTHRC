const db = require('./databaseInit')


// post-> /device
// Manually register a device that has not yet sent its first record.
module.exports.createDevice = async (req, res) => {
    const { deviceID } = req.body;
    if (!deviceID) {
        return res.status(400).json({ error: 'deviceID is required' });
    }
    const parsedDeviceID = Number(deviceID);
    if (!Number.isFinite(parsedDeviceID)) {
        return res.status(400).json({ error: 'deviceID must be a valid number' });
    }

    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare('INSERT OR IGNORE INTO device (deviceID, createdAt, lastSeen) VALUES (?, ?, ?)');
    stmt.run(parsedDeviceID, now, now, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add device' });
        }
        res.status(201).json({ deviceID: parsedDeviceID });
    });
    stmt.finalize();
}

// get -> /device
// used to get all device available
module.exports.getDevices = async (req, res) => {
    const { deviceID } = req.query;

    db.all("SELECT d.deviceID, d.createdAt, d.lastSeen FROM device d", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch device' });
        }

        if (deviceID) {
            rows = rows.filter(row => row.deviceID == deviceID);
        }

        if (rows.length == 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const now = Math.floor(Date.now() / 1000);
        const ONLINE_WINDOW_SECONDS = 10;
        const devices = rows.map((row) => ({
            ...row,
            status: row.lastSeen && (now - row.lastSeen <= ONLINE_WINDOW_SECONDS) ? 'online' : 'offline',
        }));

        res.status(200).json(devices);
    });

}

// Delete a device by ID
// delete -> /device/:deviceID
module.exports.deleteDeviceByID = (req, res) => {
    const { deviceID } = req.params;
    if (!deviceID) { 
        return res.status(404).json({error: 'Must include deviceID'})
    }
    db.run("DELETE FROM device WHERE deviceID = ?", [deviceID], function(err) {
        if (err || this.changes === 0) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.status(200).json({ message: 'Device deleted successfully' });
    });
};

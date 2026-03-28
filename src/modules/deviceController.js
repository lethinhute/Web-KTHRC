const db = require('./databaseInit')


// post-> /device
// Manually register a device that has not yet sent its first record.
module.exports.createDevice = async (req, res) => {
    const { deviceID, deviceType } = req.body;
    if (!deviceID || !deviceType) {
        return res.status(400).json({ error: 'deviceID and deviceType are required' });
    }
    const stmt = db.prepare('INSERT OR IGNORE INTO device (deviceID, deviceType) VALUES (?, ?)');
    stmt.run(Number(deviceID), deviceType, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add device' });
        }
        res.status(201).json({ deviceID: Number(deviceID), deviceType });
    });
    stmt.finalize();
}

// get -> /device
// used to get all device available
module.exports.getDevices = async (req, res) => {
    const { deviceID, deviceType } = req.query;

    db.all("SELECT d.deviceID, d.deviceType FROM device d", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch device' });
        }

        if (deviceID) {
            rows = rows.filter(row => row.deviceID == deviceID);
        }

        if (deviceType) {
            rows = rows.filter(row => row.deviceType && row.deviceType.toLowerCase() === deviceType.toLowerCase());
        }

        if (rows.length == 0) {
            return res.status(404).json({ error: 'Device not found' });
        }

        res.status(200).json(rows);
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

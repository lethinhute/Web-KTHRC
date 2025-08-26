const db = require('./databaseInit')


// post-> /device
module.exports.createDevice = async (req, res) => {
    const { deviceName, deviceType } = req.body;

    if (!deviceName || !deviceType) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const stmt = db.prepare('INSERT INTO device (deviceName, deviceType) VALUES (?, ?)');
    stmt.run(deviceName, deviceType, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to add device' });
        }
        res.status(201).json({ deviceID: this.lastID ,deviceName, deviceType });
    });
    stmt.finalize();
}

// get -> /device
// used to get all device available
module.exports.getDevices = async (req, res) => {
    // TODO: proof of concept, refactor this to use proper SQL query with 
    // parameter rather than using filter function.

    const { deviceID, deviceName, deviceType } = req.query;

    db.all("SELECT d.deviceID, d.deviceName, d.deviceType FROM device d", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch device' });
        }

        if (deviceID) {
            rows = rows.filter(row => row.deviceID == deviceID);
        }

        if (deviceName) {
            rows = rows.filter(row => row.deviceName.toLowerCase() === deviceName.toLowerCase());
        }

        if (deviceType) {
            rows = rows.filter(row => row.deviceType.toLowerCase() === deviceType.toLowerCase());
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

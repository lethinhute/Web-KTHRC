const request = require('supertest');
const app = require('../../../app');  // Import the app
const db = require('../databaseInit')

// jest.mock('../databaseInit', () => ({
//     db : jest.fn().mockImplementation(() => {
//         const sqlite3 = require('sqlite3');
//         const db = new sqlite3.Database(':memory:'); // Create an in-memory DB for testing
//         return db;
//     })
// }))
// console.log(typeof db)


beforeAll(() => {
    // Set up the database before tests (create device table)
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
});

afterEach(() => {
    // Clean up the table between tests to ensure isolation
    db.run("DELETE FROM record WHERE deviceID IN (SELECT d.deviceID FROM device d WHERE deviceType = 'Type test')");
    db.run("DELETE FROM device WHERE deviceType = 'Type test'");
});

afterAll(() => {
    // Close the DB connection after all tests
    db.close();
});

describe('Device API', () => {
    it('should create a new device via POST /device', async () => {
        const newDevice = { deviceName: 'Device A', deviceType: 'Type test' };

        const response = await request(app)
            .post('/device')
            .send(newDevice);

        expect(response.status).toBe(201);
        expect(response.body.deviceName).toBe(newDevice.deviceName);
        expect(response.body.deviceType).toBe(newDevice.deviceType);
        expect(response.body.deviceID).toBeDefined();
    });

    it('should fetch all devices via GET /device', async () => {
        // Insert a device into the database first
        await request(app).post('/device').send({ deviceName: 'Device A', deviceType: 'Type test' });
        await request(app).post('/device').send({ deviceName: 'Device B', deviceType: 'Type test' });

        const response = await request(app).get('/device');
        expect(response.status).toBe(200);
        expect(response.body.length).toBe(2);
        expect(response.body[0].deviceName).toBe('Device A');
        expect(response.body[1].deviceName).toBe('Device B');
    });

    it('should delete a device by ID via DELETE /device/:deviceID', async () => {
        // Insert a device into the database first
        const newDevice = await request(app)
            .post('/device')
            .send({ deviceName: 'Device A', deviceType: 'Type test' });

        const deviceID = newDevice.body.deviceID;

        const deleteResponse = await request(app).delete(`/device/${deviceID}`);
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe('Device deleted successfully');

        // Try to fetch the deleted device
        const fetchResponse = await request(app).get(`/device?deviceID=${deviceID}`);
        expect(fetchResponse.status).toBe(404);
        expect(fetchResponse.body.error).toBe('Device not found');
    });
});


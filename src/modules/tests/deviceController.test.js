const request = require('supertest');
const app = require('../../../server');  // Import the Express app
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
        const newDevice = { deviceID: 9001, deviceType: 'Type test' };

        const response = await request(app)
            .post('/device')
            .send(newDevice);

        expect(response.status).toBe(201);
        expect(response.body.deviceID).toBe(9001);
        expect(response.body.deviceType).toBe(newDevice.deviceType);
    });

    it('should fetch all devices via GET /device', async () => {
        await request(app).post('/device').send({ deviceID: 9001, deviceType: 'Type test' });
        await request(app).post('/device').send({ deviceID: 9002, deviceType: 'Type test' });

        const response = await request(app).get('/device?deviceType=Type%20test');
        expect(response.status).toBe(200);
        const ids = response.body.map((d) => d.deviceID);
        expect(ids).toContain(9001);
        expect(ids).toContain(9002);
    });

    it('should delete a device by ID via DELETE /device/:deviceID', async () => {
        await request(app).post('/device').send({ deviceID: 9003, deviceType: 'Type test' });

        const deleteResponse = await request(app).delete('/device/9003');
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe('Device deleted successfully');

        const fetchResponse = await request(app).get('/device?deviceID=9003');
        expect(fetchResponse.status).toBe(404);
        expect(fetchResponse.body.error).toBe('Device not found');
    });
});

describe('Record API - GET /recordLatest', () => {
    it('should return 200 with an array via GET /recordLatest', async () => {
        // The endpoint always returns 200 with an array (empty when no records exist)
        const response = await request(app).get('/recordLatest?limit=10');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return latest records after inserting via POST /record', async () => {
        const ts1 = 1700000001;
        const ts2 = 1700000002;

        // Insert two records for a test device (auto-registers device)
        await request(app).post('/record').send({ deviceID: 9001, timeStamp: ts1, Cps: 10, uSv: 0.1, deviceType: 'Type test' });
        await request(app).post('/record').send({ deviceID: 9001, timeStamp: ts2, Cps: 20, uSv: 0.2, deviceType: 'Type test' });

        const response = await request(app).get('/recordLatest?limit=10');
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);

        const timestamps = response.body.map((r) => r.timeStamp);
        expect(timestamps).toContain(ts1);
        expect(timestamps).toContain(ts2);

        // Records must be ordered newest-first
        for (let i = 0; i < response.body.length - 1; i++) {
            expect(response.body[i].timeStamp).toBeGreaterThanOrEqual(response.body[i + 1].timeStamp);
        }
    });

    it('should respect the limit parameter', async () => {
        // Insert 5 records for two test devices
        for (let i = 1; i <= 3; i++) {
            await request(app).post('/record').send({ deviceID: 9001, timeStamp: 1700000010 + i, Cps: i, uSv: i * 0.1, deviceType: 'Type test' });
        }
        for (let i = 1; i <= 3; i++) {
            await request(app).post('/record').send({ deviceID: 9002, timeStamp: 1700000020 + i, Cps: i, uSv: i * 0.1, deviceType: 'Type test' });
        }

        const response = await request(app).get('/recordLatest?limit=3');
        expect(response.status).toBe(200);
        expect(response.body.length).toBeLessThanOrEqual(3);
    });

    it('should return records from any device (not filtered by deviceID)', async () => {
        const ts1 = 1700001001;
        const ts2 = 1700001002;

        await request(app).post('/record').send({ deviceID: 9001, timeStamp: ts1, Cps: 5, uSv: 0.05, deviceType: 'Type test' });
        await request(app).post('/record').send({ deviceID: 9002, timeStamp: ts2, Cps: 7, uSv: 0.07, deviceType: 'Type test' });

        const response = await request(app).get('/recordLatest?limit=50');
        expect(response.status).toBe(200);

        const deviceIDs = response.body.map((r) => r.deviceID);
        expect(deviceIDs).toContain(9001);
        expect(deviceIDs).toContain(9002);
    });
});


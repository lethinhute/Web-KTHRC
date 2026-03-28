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


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
                    createdAt INTEGER,
                    lastSeen INTEGER
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
    db.run("DELETE FROM record WHERE deviceID IN (9001, 9002, 9003)");
    db.run("DELETE FROM device WHERE deviceID IN (9001, 9002, 9003)");
});

afterAll(() => {
    // Close the DB connection after all tests
    db.close();
});

describe('Device API', () => {
    it('should create a new device via POST /device', async () => {
        const newDevice = { deviceID: 9001 };

        const response = await request(app)
            .post('/device')
            .send(newDevice);

        expect(response.status).toBe(201);
        expect(response.body.deviceID).toBe(9001);
    });

    it('should fetch all devices via GET /device', async () => {
        await request(app).post('/device').send({ deviceID: 9001 });
        await request(app).post('/device').send({ deviceID: 9002 });

        const response = await request(app).get('/device');
        expect(response.status).toBe(200);
        const ids = response.body.map((d) => d.deviceID);
        expect(ids).toContain(9001);
        expect(ids).toContain(9002);
    });

    it('should delete a device by ID via DELETE /device/:deviceID', async () => {
        await request(app).post('/device').send({ deviceID: 9003 });

        const deleteResponse = await request(app).delete('/device/9003');
        expect(deleteResponse.status).toBe(200);
        expect(deleteResponse.body.message).toBe('Device deleted successfully');

        const fetchResponse = await request(app).get('/device?deviceID=9003');
        expect(fetchResponse.status).toBe(404);
        expect(fetchResponse.body.error).toBe('Device not found');
    });
});


const db = require('../databaseInit');
const { syncRecords, stopSync } = require('../syncService');

// Mock node-fetch so tests do not make real network calls.
jest.mock('node-fetch', () => {
    const mockFn = jest.fn();
    return { default: mockFn, __esModule: true };
});

const nodeFetch = require('node-fetch').default;

beforeAll(() => {
    db.serialize(() => {
        db.run(`CREATE TABLE IF NOT EXISTS device (
            deviceID INTEGER PRIMARY KEY,
            createdAt INTEGER,
            lastSeen INTEGER
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS record (
            deviceID INTEGER,
            timeStamp DATETIME,
            Cps REAL,
            uSv REAL,
            PRIMARY KEY (deviceID, timeStamp),
            FOREIGN KEY (deviceID) REFERENCES device(deviceID)
        )`);
    });
});

afterEach((done) => {
    stopSync();
    db.run('DELETE FROM record WHERE deviceID IN (8001, 8002)', () => {
        db.run('DELETE FROM device WHERE deviceID IN (8001, 8002)', done);
    });
    nodeFetch.mockReset();
});

afterAll(() => {
    db.close();
});

function makeResponse(status, body) {
    return {
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    };
}

describe('syncRecords', () => {
    it('inserts fetched records into the local database', async () => {
        const records = [
            { deviceID: 8001, timeStamp: 1700000001, Cps: 12, uSv: 0.12 },
            { deviceID: 8002, timeStamp: 1700000002, Cps: 34, uSv: 0.34 },
        ];

        // First call: GET /record — returns two records.
        // Subsequent calls: DELETE — succeed silently.
        nodeFetch
            .mockResolvedValueOnce(makeResponse(200, records))
            .mockResolvedValue(makeResponse(200, { message: 'deleted' }));

        await syncRecords();

        await new Promise((resolve) => {
            db.all(
                'SELECT * FROM record WHERE deviceID IN (8001, 8002) ORDER BY deviceID ASC',
                (err, rows) => {
                    expect(err).toBeNull();
                    expect(rows.length).toBe(2);
                    expect(rows[0].deviceID).toBe(8001);
                    expect(rows[1].deviceID).toBe(8002);
                    resolve();
                }
            );
        });
    });

    it('calls DELETE on the external API for each synced record', async () => {
        const records = [{ deviceID: 8001, timeStamp: 1700000003, Cps: 5, uSv: 0.05 }];

        nodeFetch
            .mockResolvedValueOnce(makeResponse(200, records))
            .mockResolvedValue(makeResponse(200, {}));

        await syncRecords();

        // GET call + 1 DELETE call
        expect(nodeFetch).toHaveBeenCalledTimes(2);
        const deleteCall = nodeFetch.mock.calls[1];
        expect(deleteCall[0]).toContain('/record/8001/1700000003');
        expect(deleteCall[1].method).toBe('DELETE');
    });

    it('does nothing when the external API returns 404 (no records)', async () => {
        nodeFetch.mockResolvedValueOnce(makeResponse(404, { error: 'No records yet...' }));

        await syncRecords();

        // Only the one GET call should have been made (no DELETEs).
        expect(nodeFetch).toHaveBeenCalledTimes(1);
    });

    it('normalises millisecond timestamps to seconds and uses raw timestamp for external DELETE', async () => {
        const msTimestamp = 1700000005000; // milliseconds
        const records = [{ deviceID: 8001, timeStamp: msTimestamp, Cps: 1, uSv: 0.01 }];

        nodeFetch
            .mockResolvedValueOnce(makeResponse(200, records))
            .mockResolvedValue(makeResponse(200, {}));

        await syncRecords();

        await new Promise((resolve) => {
            db.all(
                'SELECT timeStamp FROM record WHERE deviceID = 8001',
                (err, rows) => {
                    expect(err).toBeNull();
                    expect(rows.length).toBe(1);
                    // Should be stored as seconds, not milliseconds.
                    expect(rows[0].timeStamp).toBe(1700000005);
                    resolve();
                }
            );
        });

        // The DELETE call should use the original millisecond timestamp so the
        // external API can locate the record.
        const deleteCall = nodeFetch.mock.calls[1];
        expect(deleteCall[0]).toContain(`/record/8001/${msTimestamp}`);
    });
});

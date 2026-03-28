const nodeFetch = require('node-fetch');
const fetch = nodeFetch.default || nodeFetch;
const db = require('./databaseInit');

const EXTERNAL_API = 'https://api.rabbitcave.com.vn';
const IDLE_POLL_MS = 1000;
const ACTIVE_POLL_MS = 100;
const ERROR_RETRY_MS = 3000;
const FETCH_TIMEOUT_MS = 10000;

let syncTimer = null;
let syncRunning = false;
let syncEnabled = false;

function dbRun(sql, params) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve();
        });
    });
}

function scheduleNextRun(delayMs) {
    if (!syncEnabled) {
        return;
    }

    if (syncTimer !== null) {
        clearTimeout(syncTimer);
    }

    syncTimer = setTimeout(() => {
        syncTimer = null;
        void runSyncLoop();
    }, delayMs);
}

/**
 * Fetch all records from the external API, store them locally, then delete
 * each one from the external API so they are not double-processed.
 */
async function syncRecords() {
    let records;
    try {
        const res = await fetch(`${EXTERNAL_API}/record`, { timeout: FETCH_TIMEOUT_MS });
        if (!res.ok) {
            // 404 just means no records yet — not an error worth logging as one.
            if (res.status === 404) return { processedCount: 0, hasMoreWork: false, hadError: false };
            console.error(`[syncService] GET /record failed with status ${res.status}`);
            return { processedCount: 0, hasMoreWork: false, hadError: true };
        }
        const body = await res.json();
        if (body && body.error) {
            return { processedCount: 0, hasMoreWork: false, hadError: false };
        }
        records = Array.isArray(body) ? body : [body];
    } catch (err) {
        console.error('[syncService] Failed to fetch external records:', err.message);
        return { processedCount: 0, hasMoreWork: false, hadError: true };
    }

    let processedCount = 0;

    for (const record of records) {
        const deviceID = Number(record.deviceID);
        let timeStamp = Number(record.timeStamp);
        const Cps = Number(record.Cps);
        const uSv = Number(record.uSv);

        if (!Number.isFinite(deviceID) || !Number.isFinite(timeStamp) ||
            !Number.isFinite(Cps) || !Number.isFinite(uSv)) {
            console.warn('[syncService] Skipping record with invalid fields:', record);
            continue;
        }

        // Normalise millisecond timestamps to seconds.
        // Timestamps above 9999999999 (> year 2286 in seconds) are treated as milliseconds.
        const rawTimeStamp = timeStamp; // preserve for the external DELETE call
        if (timeStamp > 9999999999) {
            timeStamp = Math.trunc(timeStamp / 1000);
        }

        // Upsert into local DB (auto-register device if needed).
        try {
            await dbRun(
                'INSERT OR IGNORE INTO device (deviceID, createdAt, lastSeen) VALUES (?, ?, ?)',
                [deviceID, timeStamp, timeStamp]
            );
            await dbRun(
                'UPDATE device SET lastSeen = ? WHERE deviceID = ?',
                [timeStamp, deviceID]
            );
            await dbRun(
                'INSERT INTO record (deviceID, timeStamp, Cps, uSv) VALUES (?, ?, ?, ?) ' +
                'ON CONFLICT(deviceID, timeStamp) DO UPDATE SET Cps = excluded.Cps, uSv = excluded.uSv',
                [deviceID, timeStamp, Cps, uSv]
            );
        } catch (err) {
            console.error('[syncService] Failed to insert record:', err.message);
            continue;
        }

        // Remove the record from the external API now that it is stored locally.
        // Use the original (raw) timestamp the external API knows, not the normalised one.
        try {
            const delRes = await fetch(
                `${EXTERNAL_API}/record/${deviceID}/${rawTimeStamp}`,
                { method: 'DELETE', timeout: FETCH_TIMEOUT_MS }
            );
            if (!delRes.ok && delRes.status !== 404) {
                console.warn(
                    `[syncService] DELETE /record/${deviceID}/${rawTimeStamp} returned ${delRes.status}`
                );
            } else {
                processedCount += 1;
            }
        } catch (err) {
            console.warn(
                `[syncService] Could not delete record ${deviceID}/${rawTimeStamp} from external API:`,
                err.message
            );
        }
    }

    return {
        processedCount,
        hasMoreWork: processedCount > 0,
        hadError: false
    };
}

async function runSyncLoop() {
    if (!syncEnabled || syncRunning) {
        return;
    }

    syncRunning = true;

    try {
        const result = await syncRecords();

        if (syncEnabled && syncTimer === null) {
            if (result.hadError) {
                scheduleNextRun(ERROR_RETRY_MS);
            } else if (result.hasMoreWork) {
                scheduleNextRun(ACTIVE_POLL_MS);
            } else {
                scheduleNextRun(IDLE_POLL_MS);
            }
        }
    } finally {
        syncRunning = false;
    }
}

/**
 * Start the background sync loop.
 * Runs continuously with fast idle polling and immediate backlog draining.
 */
function startSync() {
    if (syncEnabled) return;
    syncEnabled = true;
    void runSyncLoop();
    console.log(`[syncService] Started — polling idle every ${IDLE_POLL_MS}ms`);
}

/**
 * Stop the background sync loop (useful in tests).
 */
function stopSync() {
    syncEnabled = false;

    if (syncTimer !== null) {
        clearTimeout(syncTimer);
        syncTimer = null;
    }
}

module.exports = { startSync, stopSync, syncRecords };

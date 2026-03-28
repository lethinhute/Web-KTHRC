const fetch = require('node-fetch').default;
const db = require('./databaseInit');

const EXTERNAL_API = 'https://api.rabbitcave.com.vn';
const SYNC_INTERVAL_MS = 30000; // 30 seconds

let syncTimer = null;

/**
 * Fetch all records from the external API, store them locally, then delete
 * each one from the external API so they are not double-processed.
 */
async function syncRecords() {
    let records;
    try {
        const res = await fetch(`${EXTERNAL_API}/record`);
        if (!res.ok) {
            // 404 just means no records yet — not an error worth logging as one.
            if (res.status === 404) return;
            console.error(`[syncService] GET /record failed with status ${res.status}`);
            return;
        }
        const body = await res.json();
        if (body && body.error) return; // empty / no records
        records = Array.isArray(body) ? body : [body];
    } catch (err) {
        console.error('[syncService] Failed to fetch external records:', err.message);
        return;
    }

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
        await new Promise((resolve) => {
            db.run(
                'INSERT OR IGNORE INTO device (deviceID, createdAt, lastSeen) VALUES (?, ?, ?)',
                [deviceID, timeStamp, timeStamp],
                () => {
                    db.run(
                        'UPDATE device SET lastSeen = ? WHERE deviceID = ?',
                        [timeStamp, deviceID],
                        () => {
                            db.run(
                                'INSERT INTO record (deviceID, timeStamp, Cps, uSv) VALUES (?, ?, ?, ?) ' +
                                'ON CONFLICT(deviceID, timeStamp) DO UPDATE SET Cps = excluded.Cps, uSv = excluded.uSv',
                                [deviceID, timeStamp, Cps, uSv],
                                (err) => {
                                    if (err) {
                                        console.error('[syncService] Failed to insert record:', err.message);
                                    }
                                    resolve();
                                }
                            );
                        }
                    );
                }
            );
        });

        // Remove the record from the external API now that it is stored locally.
        // Use the original (raw) timestamp the external API knows, not the normalised one.
        try {
            const delRes = await fetch(
                `${EXTERNAL_API}/record/${deviceID}/${rawTimeStamp}`,
                { method: 'DELETE' }
            );
            if (!delRes.ok && delRes.status !== 404) {
                console.warn(
                    `[syncService] DELETE /record/${deviceID}/${rawTimeStamp} returned ${delRes.status}`
                );
            }
        } catch (err) {
            console.warn(
                `[syncService] Could not delete record ${deviceID}/${rawTimeStamp} from external API:`,
                err.message
            );
        }
    }
}

/**
 * Start the background sync loop.
 * Runs once immediately, then on the configured interval.
 */
function startSync() {
    if (syncTimer !== null) return; // already running
    syncRecords();
    syncTimer = setInterval(syncRecords, SYNC_INTERVAL_MS);
    console.log(`[syncService] Started — syncing every ${SYNC_INTERVAL_MS / 1000}s`);
}

/**
 * Stop the background sync loop (useful in tests).
 */
function stopSync() {
    if (syncTimer !== null) {
        clearInterval(syncTimer);
        syncTimer = null;
    }
}

module.exports = { startSync, stopSync, syncRecords };

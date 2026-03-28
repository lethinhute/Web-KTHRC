import { useEffect, useRef, useState } from 'react';
import './TestDataPage.css';

const endpoint = 'https://api.rabbitcave.com.vn';
interface DataRecord {
  deviceID: number;
  timeStamp: number;
  Cps: number;
  uSv: number;
}

interface LiveEntry {
  id: string;
  deviceID: number;
  timeStamp: number;
  Cps: number;
  uSv: number;
  receivedAt: number;
}

const MAX_FEED_ENTRIES = 50;

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export default function TestDataPage() {
  const seenKeysRef = useRef<Set<string>>(new Set());
  const [latestByDevice, setLatestByDevice] = useState<Record<number, DataRecord>>({});
  const [feed, setFeed] = useState<LiveEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);


  // Poll the 50 most recent records across ALL devices every 2 seconds.
  // This replaces per-device polling so that:
  //   1. Any device sending data appears immediately (not just known devices).
  //   2. A single efficient SQL query (ORDER BY timeStamp DESC LIMIT 50) is used
  //      instead of fetching the entire record table and filtering in memory.
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`${endpoint}/recordLatest?limit=50`);
        if (!res.ok) {
          setIsConnected(false);
          return;
        }
        const records = (await res.json()) as DataRecord[] | { error: string };
        if (!Array.isArray(records) || records.length === 0) {
          setIsConnected(false);
          return;
        }

        setIsConnected(true);
        setLastUpdated(new Date());

        const now = Date.now();
        const newEntries: LiveEntry[] = [];

        // Update per-device latest values and collect unseen entries for the feed
        setLatestByDevice((prev) => {
          const updated = { ...prev };
          for (const rec of records) {
            if (!updated[rec.deviceID] || rec.timeStamp > updated[rec.deviceID].timeStamp) {
              updated[rec.deviceID] = rec;
            }

            const key = `${rec.deviceID}-${rec.timeStamp}`;
            if (!seenKeysRef.current.has(key)) {
              seenKeysRef.current.add(key);
              newEntries.push({
                id: `${rec.deviceID}-${rec.timeStamp}-${now}`,
                deviceID: rec.deviceID,
                timeStamp: rec.timeStamp,
                Cps: rec.Cps,
                uSv: rec.uSv,
                receivedAt: now,
              });
            }
          }
          return updated;
        });

        if (newEntries.length > 0) {
          // Sort new entries newest-first before prepending to the feed
          newEntries.sort((a, b) => b.timeStamp - a.timeStamp);
          setFeed((prev) => [...newEntries, ...prev].slice(0, MAX_FEED_ENTRIES));
        }
      } catch {
        setIsConnected(false);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  // All device IDs that have sent data (from the global latest poll)
  const activeDeviceIDs = Object.keys(latestByDevice).map(Number);

  return (
    <div className="testdata-page">
      <div className="testdata-header">
        <h1 className="testdata-title">Real‑Time Data Monitor</h1>
        <div className="testdata-status">
          <span className={`live-dot ${isConnected ? 'live' : 'offline'}`} />
          <span className="live-label">{isConnected ? 'LIVE' : 'Connecting…'}</span>
          {lastUpdated && (
            <span className="last-updated">
              Last update: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Latest values per device */}
      <section className="testdata-section">
        <h2 className="section-title">Latest Values per Device</h2>
        {activeDeviceIDs.length === 0 ? (
          <p className="empty-msg">No devices found.</p>
        ) : (
          <div className="device-cards-grid">
            {activeDeviceIDs.map((id) => {
              const rec = latestByDevice[id];
              return (
                <div key={id} className={`device-live-card ${rec ? 'has-data' : ''}`}>
                  <div className="dlc-header">
                    <span className="dlc-name">Device {id}</span>
                  </div>
                  {rec ? (
                    <>
                      <div className="dlc-metrics">
                        <div className="dlc-metric">
                          <span className="metric-label">CPS</span>
                          <span className="metric-value">{rec.Cps}</span>
                        </div>
                        <div className="dlc-metric">
                          <span className="metric-label">μSv/h</span>
                          <span className="metric-value">{rec.uSv}</span>
                        </div>
                      </div>
                      <p className="dlc-timestamp">{formatTimestamp(rec.timeStamp)}</p>
                    </>
                  ) : (
                    <p className="dlc-waiting">Waiting for data…</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Live feed */}
      <section className="testdata-section">
        <h2 className="section-title">Live Data Feed</h2>
        {feed.length === 0 ? (
          <p className="empty-msg">No incoming data yet.</p>
        ) : (
          <div className="feed-table-wrapper">
            <table className="feed-table">
              <thead>
                <tr>
                  <th>Received At</th>
                  <th>Device ID</th>
                  <th>Timestamp</th>
                  <th>CPS</th>
                  <th>μSv/h</th>
                </tr>
              </thead>
              <tbody>
                {feed.map((entry, idx) => (
                  <tr key={entry.id} className={idx === 0 ? 'feed-row-new' : ''}>
                    <td>{new Date(entry.receivedAt).toLocaleTimeString()}</td>
                    <td>{entry.deviceID}</td>
                    <td>{formatTimestamp(entry.timeStamp)}</td>
                    <td>{entry.Cps}</td>
                    <td>{entry.uSv}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

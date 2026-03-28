import { useEffect, useMemo, useRef, useState } from 'react';
import './TestDataPage.css';

const endpoint = 'https://api.rabbitcave.com.vn';

interface Device {
  deviceID: number;
  deviceName: string;
  deviceType: string;
}

interface DataRecord {
  deviceID: number;
  timeStamp: number;
  Cps: number;
  uSv: number;
}

interface LiveEntry {
  id: string;
  deviceID: number;
  deviceName: string;
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [latestByDevice, setLatestByDevice] = useState<Record<number, DataRecord>>({});
  const [feed, setFeed] = useState<LiveEntry[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const devicesRef = useRef<Device[]>([]);
  const prevLatestRef = useRef<Record<number, number>>({});

  // Keep devicesRef in sync
  useEffect(() => {
    devicesRef.current = devices;
  }, [devices]);

  // Fetch device list every 10 seconds
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${endpoint}/device`);
        if (!res.ok) return;
        const data = (await res.json()) as Device[] | { error: string };
        if (Array.isArray(data)) {
          setDevices(data);
        }
      } catch {
        // ignore
      }
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  // Poll latest record per device every 2 seconds
  useEffect(() => {
    const poll = async () => {
      const devs = devicesRef.current;
      if (devs.length === 0) return;

      const now = Date.now();

      // Fetch all devices concurrently
      const results = await Promise.all(
        devs.map(async (dev) => {
          try {
            const res = await fetch(`${endpoint}/record?deviceID=${dev.deviceID}`);
            if (!res.ok) return null;
            const records = (await res.json()) as DataRecord[] | { error: string };
            if (!Array.isArray(records) || records.length === 0) return null;
            const latest = records.reduce((a, b) => (a.timeStamp > b.timeStamp ? a : b));
            return { dev, latest };
          } catch {
            return null;
          }
        })
      );

      let anySuccess = false;
      const newLatest: Record<number, DataRecord> = {};
      const newEntries: LiveEntry[] = [];

      for (const result of results) {
        if (!result) continue;
        const { dev, latest } = result;
        newLatest[dev.deviceID] = latest;
        anySuccess = true;

        // If this is newer than what we tracked, add to the live feed
        const prevTs = prevLatestRef.current[dev.deviceID] ?? -1;
        if (latest.timeStamp > prevTs) {
          newEntries.push({
            id: `${dev.deviceID}-${latest.timeStamp}-${now}`,
            deviceID: dev.deviceID,
            deviceName: dev.deviceName,
            timeStamp: latest.timeStamp,
            Cps: latest.Cps,
            uSv: latest.uSv,
            receivedAt: now,
          });
          prevLatestRef.current[dev.deviceID] = latest.timeStamp;
        }
      }

      if (anySuccess) {
        setLatestByDevice(newLatest);
        setLastUpdated(new Date());
        setIsConnected(true);
        if (newEntries.length > 0) {
          setFeed((prev) =>
            [...newEntries, ...prev].slice(0, MAX_FEED_ENTRIES)
          );
        }
      } else {
        setIsConnected(false);
      }
    };

    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const deviceNameMap = useMemo(
    () => new Map(devices.map((d) => [d.deviceID, d.deviceName])),
    [devices]
  );

  const deviceName = (id: number) => deviceNameMap.get(id) ?? `Device ${id}`;

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
        {devices.length === 0 ? (
          <p className="empty-msg">No devices found.</p>
        ) : (
          <div className="device-cards-grid">
            {devices.map((dev) => {
              const rec = latestByDevice[dev.deviceID];
              return (
                <div key={dev.deviceID} className={`device-live-card ${rec ? 'has-data' : ''}`}>
                  <div className="dlc-header">
                    <span className="dlc-name">{dev.deviceName}</span>
                    <span className="dlc-type">{dev.deviceType}</span>
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
                  <th>Device Name</th>
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
                    <td>{deviceName(entry.deviceID)}</td>
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

import { useCallback, useEffect, useRef, useState } from 'react';
import './DataPage.css';

// Extend window for Plotly
declare global {
  interface Window {
    Plotly: {
      newPlot: (
        el: HTMLElement,
        data: unknown[],
        layout: PlotlyLayout,
        config?: PlotlyConfig
      ) => void;
      react: (
        el: HTMLElement,
        data: unknown[],
        layout: PlotlyLayout
      ) => void;
    };
  }
}

type PlotlyLayout = { [key: string]: unknown };
type PlotlyConfig = { [key: string]: unknown };

const endpoint = 'https://api.rabbitcave.com.vn';

interface Device {
  deviceID: number;
  deviceName: string;
  deviceType: string;
}

interface DataRecord {
  deviceID: number;
  timestamp: string;
  value: number;
}

export default function DataPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [allDevicesVisible, setAllDevicesVisible] = useState(false);
  const plotRef = useRef<HTMLDivElement>(null);
  const allChartsRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch device list
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
    const deviceInterval = setInterval(load, 10000);
    return () => clearInterval(deviceInterval);
  }, []);

  // Fetch & plot records for selected device
  const loadDeviceData = async (deviceId: number) => {
    if (refreshRef.current) clearInterval(refreshRef.current);
    const fetchAndPlot = async () => {
      try {
        const res = await fetch(`${endpoint}/record?deviceID=${deviceId}`);
        if (!res.ok) return;
        const records = (await res.json()) as DataRecord[] | { error: string };
        if (!Array.isArray(records)) return;
        const xData = records.map((r) => r.timestamp);
        const yData = records.map((r) => r.value);
        if (plotRef.current && window.Plotly) {
          const trace = {
            x: xData,
            y: yData,
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: '#5b65b5', size: 4 },
            line: { color: '#5b65b5', width: 2 },
          };
          const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#fff', family: 'BaiJamjuree, sans-serif' },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa' },
            margin: { t: 20, b: 60, l: 60, r: 20 },
          };
          window.Plotly.react(plotRef.current, [trace], layout);
        }
      } catch {
        // ignore
      }
    };
    await fetchAndPlot();
    refreshRef.current = setInterval(fetchAndPlot, 3000);
  };

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
    setDropdownOpen(false);
    loadDeviceData(device.deviceID);
  };

  // Export helpers
  const exportData = async (format: 'csv' | 'xlsx' | 'tsv') => {
    if (!selectedDevice) return;
    try {
      let url = `${endpoint}/record?deviceID=${selectedDevice.deviceID}`;
      if (startTime) url += `&start=${startTime}`;
      if (endTime) url += `&end=${endTime}`;
      const res = await fetch(url);
      const records = (await res.json()) as DataRecord[] | { error: string };
      if (!Array.isArray(records) || !records.length) return;

      if (format === 'csv' || format === 'tsv') {
        const sep = format === 'csv' ? ',' : '\t';
        const header = `Timestamp${sep}Value\n`;
        const rows = records.map((r) => `${r.timestamp}${sep}${r.value}`).join('\n');
        const blob = new Blob([header + rows], { type: 'text/plain' });
        downloadBlob(blob, `data.${format}`);
      }
    } catch {
      // ignore
    }
  };

  const exportAllDevicesData = async (format: 'csv' | 'xlsx' | 'tsv') => {
    try {
      const res = await fetch(`${endpoint}/device`);
      const devs = (await res.json()) as Device[] | { error: string };
      if (!Array.isArray(devs)) return;
      const sep = format === 'tsv' ? '\t' : ',';
      let content = `DeviceID${sep}Timestamp${sep}Value\n`;
      for (const d of devs) {
        const r = await fetch(`${endpoint}/record?deviceID=${d.deviceID}`);
        const records = (await r.json()) as DataRecord[] | { error: string };
        if (Array.isArray(records)) {
          records.forEach((rec) => {
            content += `${d.deviceID}${sep}${rec.timestamp}${sep}${rec.value}\n`;
          });
        }
      }
      const blob = new Blob([content], { type: 'text/plain' });
      downloadBlob(blob, `all_devices.${format === 'xlsx' ? 'csv' : format}`);
    } catch {
      // ignore
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Render all device charts using the current device list
  const renderAllDeviceCharts = useCallback(async (devs: Device[]) => {
    if (!allChartsRef.current) return;
    allChartsRef.current.innerHTML = '';
    for (const d of devs) {
      try {
        const r = await fetch(`${endpoint}/record?deviceID=${d.deviceID}`);
        const records = (await r.json()) as DataRecord[] | { error: string };
        const container = document.createElement('div');
        container.className = 'device-chart-item';
        const title = document.createElement('p');
        title.className = 'device-chart-title';
        title.textContent = `Device ${d.deviceID} — ${d.deviceName}`;
        container.appendChild(title);
        const plotDiv = document.createElement('div');
        plotDiv.style.width = '100%';
        plotDiv.style.height = '260px';
        container.appendChild(plotDiv);
        allChartsRef.current.appendChild(container);
        if (window.Plotly && Array.isArray(records)) {
          const trace = {
            x: records.map((rec) => rec.timestamp),
            y: records.map((rec) => rec.value),
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: '#5b65b5', size: 4 },
            line: { color: '#5b65b5', width: 2 },
          };
          const layout = {
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: '#fff' },
            xaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa' },
            yaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa' },
            margin: { t: 10, b: 50, l: 50, r: 10 },
          };
          window.Plotly.newPlot(plotDiv, [trace], layout);
        }
      } catch {
        // ignore
      }
    }
  }, []);

  // Show all devices charts
  const handleShowAllDevices = async () => {
    const nowVisible = !allDevicesVisible;
    setAllDevicesVisible(nowVisible);
    if (nowVisible) {
      await renderAllDeviceCharts(devices);
    }
  };

  // Re-render all device charts when the device list updates and the panel is open
  useEffect(() => {
    if (allDevicesVisible && devices.length > 0) {
      void renderAllDeviceCharts(devices);
    }
  }, [devices, allDevicesVisible, renderAllDeviceCharts]);

  useEffect(() => {
    return () => {
      if (refreshRef.current) clearInterval(refreshRef.current);
    };
  }, []);

  return (
    <div className="data-page">
      <div className="data-header">
        <h1 className="data-page-title">Data Dashboard</h1>
      </div>

      {/* Device selector + info */}
      <div className="data-controls">
        <div className="data-card">
          <p className="data-card-title">Choose devices</p>
          <div className="custom-dropdown">
            <button
              className="dropdown-toggle-btn"
              onClick={() => setDropdownOpen((o) => !o)}
            >
              {selectedDevice ? `Device ${selectedDevice.deviceID}` : 'Devices'}
              <span className={`arrow ${dropdownOpen ? 'up' : ''}`}>▾</span>
            </button>
            {dropdownOpen && (
              <ul className="dropdown-list">
                {devices.length === 0 ? (
                  <li className="dropdown-empty">Không có thiết bị</li>
                ) : (
                  devices.map((d) => (
                    <li
                      key={d.deviceID}
                      className="dropdown-item"
                      onClick={() => handleSelectDevice(d)}
                    >
                      Device {d.deviceID}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="data-card">
          <p className="data-card-title">Device information</p>
          {selectedDevice ? (
            <div className="device-info">
              <p>
                <span className="info-label">Name device: </span>
                {selectedDevice.deviceName}
              </p>
              <p>
                <span className="info-label">Id device: </span>
                {selectedDevice.deviceID}
              </p>
              <p>
                <span className="info-label">Device type: </span>
                {selectedDevice.deviceType}
              </p>
            </div>
          ) : (
            <p className="device-info-placeholder">No device selected</p>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="chart-card">
        <div ref={plotRef} className="plot-area" />
      </div>

      {/* Export controls */}
      <div className="export-section">
        <div className="time-inputs">
          <label className="time-label">
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="time-input"
            />
          </label>
          <label className="time-label">
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="time-input"
            />
          </label>
        </div>
        <div className="export-buttons">
          <button className="export-btn csv" onClick={() => exportData('csv')}>
            📥 Export CSV
          </button>
          <button className="export-btn xlsx" onClick={() => exportData('xlsx')}>
            📥 Export XLSX
          </button>
          <button className="export-btn tsv" onClick={() => exportData('tsv')}>
            📥 Export TSV
          </button>
        </div>
      </div>

      {/* All devices */}
      <div className="all-devices-section">
        <button className="show-all-btn" onClick={handleShowAllDevices}>
          {allDevicesVisible ? '🔽 Hide All Devices' : '📊 Show All Devices'}
        </button>

        {allDevicesVisible && (
          <div className="all-devices-panel">
            <h3 className="all-devices-title">📡 All Device Data</h3>
            <div ref={allChartsRef} className="all-charts-grid" />
            <div className="export-buttons" style={{ marginTop: 16 }}>
              <button className="export-btn csv" onClick={() => exportAllDevicesData('csv')}>
                📥 Export CSV
              </button>
              <button className="export-btn xlsx" onClick={() => exportAllDevicesData('xlsx')}>
                📥 Export XLSX
              </button>
              <button className="export-btn tsv" onClick={() => exportAllDevicesData('tsv')}>
                📥 Export TSV
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

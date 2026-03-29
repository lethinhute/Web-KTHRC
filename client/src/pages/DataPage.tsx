import { useCallback, useEffect, useRef, useState } from 'react';
import './DataPage.css';

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
type Timeframe = '1h' | '6h' | '12h' | '1d' | '1w' | '1m' | '1y' | 'custom';

const endpoint = 'https://api.rabbitcave.com.vn';
const timeframeOptions: Array<{ label: string; value: Timeframe }> = [
  { label: '1H', value: '1h' },
  { label: '6H', value: '6h' },
  { label: '12H', value: '12h' },
  { label: '1D', value: '1d' },
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '1Y', value: '1y' },
  { label: 'Custom', value: 'custom' },
];

interface Device {
  deviceID: number;
  status?: string;
  lastSeen?: number | null;
}

interface DataRecord {
  deviceID: number;
  timeStamp: number;
  Cps: number;
  uSv: number;
}

function toUnixTimestamp(value: string): number | null {
  if (!value) return null;

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.floor(parsed / 1000);
}

function toDatetimeLocalValue(unixSeconds: number): string {
  const date = new Date(unixSeconds * 1000);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function getPresetRange(timeframe: Exclude<Timeframe, 'custom'>): { startTime: number; endTime: number } {
  const end = Math.floor(Date.now() / 1000);
  const secondsByTimeframe = {
    '1h': 1 * 60 * 60,
    '6h': 6 * 60 * 60,
    '12h': 12 * 60 * 60,
    '1d': 24 * 60 * 60,
    '1w': 7 * 24 * 60 * 60,
    '1m': 30 * 24 * 60 * 60,
    '1y': 365 * 24 * 60 * 60,
  } satisfies Record<Exclude<Timeframe, 'custom'>, number>;

  return {
    startTime: end - secondsByTimeframe[timeframe],
    endTime: end,
  };
}

function getQueryRange(timeframe: Timeframe, startTime: string, endTime: string) {
  if (timeframe === 'custom') {
    return {
      startTime: toUnixTimestamp(startTime),
      endTime: toUnixTimestamp(endTime),
    };
  }

  return getPresetRange(timeframe);
}

function buildRecordUrl(deviceId: number, timeframe: Timeframe, startTime: string, endTime: string): string {
  const url = new URL(`${endpoint}/record`);
  url.searchParams.set('deviceID', String(deviceId));

  const range = getQueryRange(timeframe, startTime, endTime);
  if (range.startTime !== null) {
    url.searchParams.set('startTime', String(range.startTime));
  }
  if (range.endTime !== null) {
    url.searchParams.set('endTime', String(range.endTime));
  }

  return url.toString();
}

function summarizeRecords(records: DataRecord[]) {
  if (records.length === 0) {
    return {
      samples: 0,
      avgCps: null,
      avgUSv: null,
      latestCps: null,
      latestUSv: null,
    };
  }

  const totalCps = records.reduce((sum, record) => sum + record.Cps, 0);
  const totalUSv = records.reduce((sum, record) => sum + record.uSv, 0);
  const latest = records[records.length - 1];

  return {
    samples: records.length,
    avgCps: totalCps / records.length,
    avgUSv: totalUSv / records.length,
    latestCps: latest.Cps,
    latestUSv: latest.uSv,
  };
}

function formatMetric(value: number | null, digits = 2): string {
  return value === null ? '--' : value.toFixed(digits);
}

export default function DataPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>('1h');
  const [allDevicesVisible, setAllDevicesVisible] = useState(false);
  const [records, setRecords] = useState<DataRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Select a device to view data.');
  const plotRef = useRef<HTMLDivElement>(null);
  const allChartsRef = useRef<HTMLDivElement>(null);
  const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const initialRange = getPresetRange('1h');
    setStartTime(toDatetimeLocalValue(initialRange.startTime));
    setEndTime(toDatetimeLocalValue(initialRange.endTime));
  }, []);

  useEffect(() => {
    const loadDevices = async () => {
      try {
        const response = await fetch(`${endpoint}/device`);
        if (!response.ok) return;

        const data = (await response.json()) as Device[] | { error: string };
        if (!Array.isArray(data)) return;

        setDevices(data);
        setSelectedDevice((current) => {
          if (!current) return current;
          return data.find((device) => device.deviceID === current.deviceID) ?? current;
        });
      } catch {
        // ignore transient fetch failures
      }
    };

    void loadDevices();
    const deviceInterval = setInterval(loadDevices, 10000);
    return () => clearInterval(deviceInterval);
  }, []);

  const plotRecords = useCallback((nextRecords: DataRecord[], uiRevision: string) => {
    if (!plotRef.current || !window.Plotly) return;

    if (nextRecords.length === 0) {
      window.Plotly.react(plotRef.current, [], {
        uirevision: uiRevision,
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: { color: '#fff', family: 'BaiJamjuree, sans-serif' },
        annotations: [
          {
            text: 'No data in the selected timeframe',
            showarrow: false,
            x: 0.5,
            y: 0.5,
            xref: 'paper',
            yref: 'paper',
            font: { size: 16, color: '#b5bfd7' },
          },
        ],
        xaxis: { visible: false },
        yaxis: { visible: false },
        margin: { t: 20, b: 20, l: 20, r: 20 },
      });
      return;
    }

    const xData = nextRecords.map((record) => new Date(record.timeStamp * 1000).toLocaleString());
    const traceCps = {
      x: xData,
      y: nextRecords.map((record) => record.Cps),
      name: 'CPS',
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color: '#5b65b5', size: 4 },
      line: { color: '#5b65b5', width: 2 },
    };
    const traceUSv = {
      x: xData,
      y: nextRecords.map((record) => record.uSv),
      name: 'μSv/h',
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color: '#e07b54', size: 4 },
      line: { color: '#e07b54', width: 2 },
      yaxis: 'y2',
    };

    window.Plotly.react(plotRef.current, [traceCps, traceUSv], {
      uirevision: uiRevision,
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { color: '#fff', family: 'BaiJamjuree, sans-serif' },
      xaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa', title: 'Date / Time' },
      yaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa', title: 'CPS' },
      yaxis2: { overlaying: 'y', side: 'right', color: '#e07b54', title: 'μSv/h', showgrid: false },
      legend: { orientation: 'h', y: -0.2 },
      margin: { t: 20, b: 80, l: 60, r: 60 },
    });
  }, []);

  const fetchDeviceRecords = useCallback(async (deviceId: number) => {
    const response = await fetch(buildRecordUrl(deviceId, activeTimeframe, startTime, endTime));
    if (!response.ok) {
      return [] as DataRecord[];
    }

    const data = (await response.json()) as DataRecord[] | { error: string };
    return Array.isArray(data) ? data : [];
  }, [activeTimeframe, startTime, endTime]);

  const loadDeviceData = useCallback(async (deviceId: number) => {
    if (refreshRef.current) {
      clearInterval(refreshRef.current);
    }

    const fetchAndPlot = async (showSpinner: boolean) => {
      if (showSpinner) {
        setIsLoading(true);
      }

      try {
        const nextRecords = await fetchDeviceRecords(deviceId);
        setRecords(nextRecords);
        setStatusMessage(
          nextRecords.length === 0
            ? 'No signal data found for the selected timeframe.'
            : `Showing ${nextRecords.length} samples for device ${deviceId}.`
        );
        plotRecords(nextRecords, `${deviceId}-${activeTimeframe}`);
      } catch {
        setRecords([]);
        setStatusMessage('Failed to load signal data.');
        plotRecords([], `${deviceId}-${activeTimeframe}`);
      } finally {
        if (showSpinner) {
          setIsLoading(false);
        }
      }
    };

    await fetchAndPlot(true);
    refreshRef.current = setInterval(() => {
      void fetchAndPlot(false);
    }, 3000);
  }, [fetchDeviceRecords, plotRecords]);

  useEffect(() => {
    if (!selectedDevice) return;
    void loadDeviceData(selectedDevice.deviceID);
  }, [selectedDevice, activeTimeframe, startTime, endTime, loadDeviceData]);

  const handleSelectDevice = (device: Device) => {
    setSelectedDevice(device);
    setDropdownOpen(false);
  };

  const handleTimeframeSelect = (timeframe: Timeframe) => {
    setActiveTimeframe(timeframe);

    if (timeframe !== 'custom') {
      const range = getPresetRange(timeframe);
      setStartTime(toDatetimeLocalValue(range.startTime));
      setEndTime(toDatetimeLocalValue(range.endTime));
    }
  };

  const exportData = async (format: 'csv' | 'xlsx' | 'tsv') => {
    if (!selectedDevice) return;

    try {
      const response = await fetch(buildRecordUrl(selectedDevice.deviceID, activeTimeframe, startTime, endTime));
      const data = (await response.json()) as DataRecord[] | { error: string };
      if (!Array.isArray(data) || data.length === 0) return;

      if (format === 'csv' || format === 'tsv') {
        const separator = format === 'csv' ? ',' : '\t';
        const header = `Timestamp${separator}CPS${separator}uSv_per_h\n`;
        const rows = data.map((record) => (
          `${new Date(record.timeStamp * 1000).toLocaleString()}${separator}${record.Cps}${separator}${record.uSv}`
        )).join('\n');
        const blob = new Blob([header + rows], { type: 'text/plain' });
        downloadBlob(blob, `data.${format}`);
      }
    } catch {
      // ignore
    }
  };

  const exportAllDevicesData = async (format: 'csv' | 'xlsx' | 'tsv') => {
    try {
      const response = await fetch(`${endpoint}/device`);
      const allDevices = (await response.json()) as Device[] | { error: string };
      if (!Array.isArray(allDevices)) return;

      const separator = format === 'tsv' ? '\t' : ',';
      let content = `DeviceID${separator}Timestamp${separator}CPS${separator}uSv_per_h\n`;

      for (const device of allDevices) {
        const recordsResponse = await fetch(buildRecordUrl(device.deviceID, activeTimeframe, startTime, endTime));
        const data = (await recordsResponse.json()) as DataRecord[] | { error: string };
        if (!Array.isArray(data)) continue;

        data.forEach((record) => {
          content += `${device.deviceID}${separator}${new Date(record.timeStamp * 1000).toLocaleString()}${separator}${record.Cps}${separator}${record.uSv}\n`;
        });
      }

      const blob = new Blob([content], { type: 'text/plain' });
      downloadBlob(blob, `all_devices.${format === 'xlsx' ? 'csv' : format}`);
    } catch {
      // ignore
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderAllDeviceCharts = useCallback(async (allDevices: Device[]) => {
    if (!allChartsRef.current) return;

    allChartsRef.current.innerHTML = '';
    for (const device of allDevices) {
      try {
        const response = await fetch(buildRecordUrl(device.deviceID, activeTimeframe, startTime, endTime));
        const data = (await response.json()) as DataRecord[] | { error: string };

        const container = document.createElement('div');
        container.className = 'device-chart-item';

        const title = document.createElement('p');
        title.className = 'device-chart-title';
        title.textContent = `Device ${device.deviceID}`;
        container.appendChild(title);

        const plotDiv = document.createElement('div');
        plotDiv.style.width = '100%';
        plotDiv.style.height = '260px';
        container.appendChild(plotDiv);

        allChartsRef.current.appendChild(container);

        if (!window.Plotly || !Array.isArray(data) || data.length === 0) {
          plotDiv.innerHTML = '<p class="device-chart-empty">No data in timeframe.</p>';
          continue;
        }

        const xDates = data.map((record) => new Date(record.timeStamp * 1000).toLocaleString());
        const traceCps = {
          x: xDates,
          y: data.map((record) => record.Cps),
          name: 'CPS',
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: '#5b65b5', size: 3 },
          line: { color: '#5b65b5', width: 1.5 },
        };
        const traceUSv = {
          x: xDates,
          y: data.map((record) => record.uSv),
          name: 'μSv/h',
          type: 'scatter',
          mode: 'lines+markers',
          marker: { color: '#e07b54', size: 3 },
          line: { color: '#e07b54', width: 1.5 },
          yaxis: 'y2',
        };

        window.Plotly.newPlot(plotDiv, [traceCps, traceUSv], {
          paper_bgcolor: 'rgba(0,0,0,0)',
          plot_bgcolor: 'rgba(0,0,0,0)',
          font: { color: '#fff' },
          xaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa', title: 'Date / Time' },
          yaxis: { gridcolor: 'rgba(255,255,255,0.1)', color: '#aaa', title: 'CPS' },
          yaxis2: { overlaying: 'y', side: 'right', color: '#e07b54', title: 'μSv/h', showgrid: false },
          legend: { orientation: 'h', y: -0.25 },
          margin: { t: 10, b: 70, l: 50, r: 50 },
        });
      } catch {
        // ignore
      }
    }
  }, [activeTimeframe, startTime, endTime]);

  const handleShowAllDevices = async () => {
    const nextVisible = !allDevicesVisible;
    setAllDevicesVisible(nextVisible);
    if (nextVisible) {
      await renderAllDeviceCharts(devices);
    }
  };

  useEffect(() => {
    if (allDevicesVisible && devices.length > 0) {
      void renderAllDeviceCharts(devices);
    }
  }, [devices, allDevicesVisible, renderAllDeviceCharts]);

  useEffect(() => () => {
    if (refreshRef.current) {
      clearInterval(refreshRef.current);
    }
  }, []);

  const summary = summarizeRecords(records);

  return (
    <div className="data-page">
      <div className="data-header">
        <h1 className="data-page-title">Data Dashboard</h1>
        <p className="data-page-subtitle">Compare signal levels across fixed windows or define a custom range.</p>
      </div>

      <div className="data-controls">
        <div className="data-card">
          <p className="data-card-title">Choose devices</p>
          <div className="custom-dropdown">
            <button
              className="dropdown-toggle-btn"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              {selectedDevice ? `Device ${selectedDevice.deviceID}` : 'Devices'}
              <span className={`arrow ${dropdownOpen ? 'up' : ''}`}>▾</span>
            </button>
            {dropdownOpen && (
              <ul className="dropdown-list">
                {devices.length === 0 ? (
                  <li className="dropdown-empty">Không có thiết bị</li>
                ) : (
                  devices.map((device) => (
                    <li
                      key={device.deviceID}
                      className="dropdown-item"
                      onClick={() => handleSelectDevice(device)}
                    >
                      Device {device.deviceID}
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
              <p><span className="info-label">Device ID: </span>{selectedDevice.deviceID}</p>
              <p><span className="info-label">Status: </span>{selectedDevice.status ?? 'unknown'}</p>
              <p>
                <span className="info-label">Last seen: </span>
                {selectedDevice.lastSeen ? new Date(selectedDevice.lastSeen * 1000).toLocaleString() : 'No heartbeat yet'}
              </p>
            </div>
          ) : (
            <p className="device-info-placeholder">No device selected</p>
          )}
        </div>
      </div>

      <div className="timeframe-card">
        <div className="timeframe-buttons" role="tablist" aria-label="Timeframe selectors">
          {timeframeOptions.map((option) => (
            <button
              key={option.value}
              className={`timeframe-btn ${activeTimeframe === option.value ? 'active' : ''}`}
              onClick={() => handleTimeframeSelect(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="time-inputs compact">
          <label className="time-label">
            Start Time
            <input
              type="datetime-local"
              value={startTime}
              onChange={(event) => {
                setActiveTimeframe('custom');
                setStartTime(event.target.value);
              }}
              className="time-input"
            />
          </label>
          <label className="time-label">
            End Time
            <input
              type="datetime-local"
              value={endTime}
              onChange={(event) => {
                setActiveTimeframe('custom');
                setEndTime(event.target.value);
              }}
              className="time-input"
            />
          </label>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card">
          <span className="summary-label">Samples</span>
          <strong className="summary-value">{summary.samples}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Latest CPS</span>
          <strong className="summary-value">{formatMetric(summary.latestCps, 0)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Average CPS</span>
          <strong className="summary-value">{formatMetric(summary.avgCps, 1)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Latest μSv/h</span>
          <strong className="summary-value">{formatMetric(summary.latestUSv, 2)}</strong>
        </div>
        <div className="summary-card">
          <span className="summary-label">Average μSv/h</span>
          <strong className="summary-value">{formatMetric(summary.avgUSv, 2)}</strong>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <p className="data-card-title">Signal history</p>
            <p className="chart-status-text">{statusMessage}</p>
          </div>
          {isLoading && <span className="chart-loading">Refreshing…</span>}
        </div>
        <div ref={plotRef} className="plot-area" />
      </div>

      <div className="export-section">
        <div className="export-buttons">
          <button className="export-btn csv" onClick={() => exportData('csv')}>Export CSV</button>
          <button className="export-btn xlsx" onClick={() => exportData('xlsx')}>Export XLSX</button>
          <button className="export-btn tsv" onClick={() => exportData('tsv')}>Export TSV</button>
        </div>
      </div>

      <div className="all-devices-section">
        <button className="show-all-btn" onClick={handleShowAllDevices}>
          {allDevicesVisible ? 'Hide All Devices' : 'Show All Devices'}
        </button>

        {allDevicesVisible && (
          <div className="all-devices-panel">
            <h3 className="all-devices-title">All Device Data</h3>
            <div ref={allChartsRef} className="all-charts-grid" />
            <div className="export-buttons" style={{ marginTop: 16 }}>
              <button className="export-btn csv" onClick={() => exportAllDevicesData('csv')}>Export CSV</button>
              <button className="export-btn xlsx" onClick={() => exportAllDevicesData('xlsx')}>Export XLSX</button>
              <button className="export-btn tsv" onClick={() => exportAllDevicesData('tsv')}>Export TSV</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

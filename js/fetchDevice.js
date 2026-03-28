// Arrays to store x and y data points
let xArray = [];
let yArray = [];

// Time interval for refreshing data
const timeIntervals = 3000;

// API endpoint
const endpoint = 'https://api.rabbitcave.com.vn';

// Variable to store interval ID for refreshing data
let devices_intervals = undefined;

// Function to fetch device data from the API
async function fecthDevice(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Http error! Status : ${response.status}$');
        }
        const data = await response.json();

        const outputList = document.getElementById("listDevice");
        outputList.innerHTML = "";

        if (data.error) {
            console.warn("API Error:", data.error);
            const listItem = document.createElement("li");
            listItem.classList.add("dropdown-item");

            const link = document.createElement("a");
            link.textContent = "Không có thiết bị";
            listItem.appendChild(link);
            outputList.appendChild(listItem);
            return null;
        }

        const devices = Array.isArray(data) ? data : [data];
        devices.forEach(device => {
            const listItem = document.createElement("li");
            listItem.classList.add("dropdown-item"); // Assign class to each device

            listItem.onclick = (event) => {
                event.preventDefault(); // Prevent default navigation
                getDevice(`${endpoint}/device?deviceID=`, device.deviceID);
            };

            const link = document.createElement("a");
            link.textContent = `Device ${device.deviceID}`;
            listItem.appendChild(link);
            outputList.appendChild(listItem);
        });

        console.log("Fetched devices:", data);
        return data;
    } catch (error) {
        console.error("Error fetching data:", error);
        console.error(apiUrl);
    }
}

// Function to get device data by ID
async function getDevice(apiUrl, id) {
    CURRENT_SELECTED_DEVICE_ID = id;
    try {
        apiUrl += id;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Http error! Status : ${response.status}$');
        }
        const data = await response.json();
        if (data.error) {
            console.warn("API Error:", data.error);
            return null;
        }

        // Clear previous data
        xArray = [];
        yArray = [];

        const devices = Array.isArray(data) ? data : [data];
        devices.forEach(device => {
            let num = device.deviceID;
            document.getElementById("infoId").textContent = `${num.toString()}`;
            document.getElementById("infoType").textContent = `${device.deviceType}`;
        });

        console.log("Fetched devices:", devices);
        getData(`${endpoint}/record?deviceID=`, id);
    } catch (error) {
        console.error("Error fetching data: ", error);
        console.error(apiUrl);
    }
}

// Function to fetch all devices and display charts
async function fetchAllDevicesWithCharts(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const deviceContainer = document.getElementById("deviceChartGrid"); // Change to correct container
        deviceContainer.innerHTML = ""; // Clear previous data

        if (data.error) {
            console.warn("API Error:", data.error);
            deviceContainer.innerHTML = "<p class='text-white'>No devices found</p>";
            return;
        }

        const devices = Array.isArray(data) ? data : [data];

        // Loop through devices and create charts
        for (let device of devices) {
            // Create chart container
            const chartWrapper = document.createElement("div");
            chartWrapper.classList.add("device-chart");

            // Device Title
            const title = document.createElement("h5");
            title.classList.add("device-title");
            title.textContent = `Device ${device.deviceID}`;
            chartWrapper.appendChild(title);

            // Chart Div
            const chartDiv = document.createElement("div");
            chartDiv.id = `chart-${device.deviceID}`;
            chartDiv.style.width = "100%";
            chartDiv.style.height = "300px";
            chartWrapper.appendChild(chartDiv);

            deviceContainer.appendChild(chartWrapper); // Append to #deviceChartGrid

            // Fetch and plot data for each device
            await plotDeviceData(`${endpoint}/record?deviceID=`, device.deviceID, chartDiv.id);
        }
    } catch (error) {
        console.error("Error fetching all devices with charts:", error);
    }
}

// Function to plot device data on a chart
async function plotDeviceData(apiUrl, id, chartId) {
    try {
        apiUrl += id;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        if (data.error) {
            console.warn("API Error:", data.error);
            return;
        }

        let xArray = [];
        let yArray = [];

        const devices = Array.isArray(data) ? data : [data];
        devices.forEach(device => {
            const myUnixTimestamp = device.timeStamp;
            const myDate = new Date(myUnixTimestamp * 1000);
            xArray.push(myDate);
            yArray.push(parseInt(device.Cps));
        });

        const dataDevice = [{
            x: xArray,
            y: yArray,
            type: 'scatter',
            mode: 'lines',  // Ensures it's a line chart
            line: { color: 'white', width: 2 } // Change line color to white
        }];

        const layout = {
            xaxis: { title: "Time", gridcolor: 'rgb(255, 255, 255)', color: 'white' },
            yaxis: { title: "CPS", gridcolor: 'rgb(255, 255, 255)', color: 'white' },
            title: { text: `Data for Device ${id}`, font: { color: 'white' } },
            paper_bgcolor: '#00000000',
            plot_bgcolor: '#00000000',
        };

        // Display chart using Plotly
        Plotly.newPlot(chartId, dataDevice, layout, { scrollZoom: true });
    } catch (error) {
        console.error(`Error fetching data for device ${id}:`, error);
    }
}

// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("showAllDevicesBtn").addEventListener("click", () => {
        fetchAllDevicesWithCharts(`${endpoint}/device`);
    });
});

// Function to fetch data and update chart
async function getData(apiUrl, id) {
    try {
        apiUrl += id;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Http error! Status : ${response.status}$');
        }
        const data = await response.json();
        if (data.error) {
            console.warn("API Error:", data.error);
            return null;
        }

        const devices = Array.isArray(data) ? data : [data];
        devices.forEach(device => {
            const myUnixTimestamp = device.timeStamp; // start with a Unix timestamp
            const myDate = new Date(myUnixTimestamp * 1000); // convert timestamp to milliseconds and construct Date object
            xArray.push(myDate);
            yArray.push(parseInt(device.Cps).toString());
        });

        const dataDevice = [{
            x: xArray,
            y: yArray,
            type: 'scatter',
            marker: {
                color: 'black',
            }
        }];

        // Define Layout
        const layout = {
            xaxis: {
                autorange: true,
                title: "Time",
                gridcolor: 'rgb(255, 255, 255)',
            },
            yaxis: {
                autorange: true,
                title: "CPS",
                gridcolor: 'rgb(255, 255, 255)',
            },
            title: "Data table",
            paper_bgcolor: '#00000000',
            plot_bgcolor: '#00000000',
        };

        // Display using Plotly
        Plotly.newPlot("myPlot", dataDevice, layout, { scrollZoom: true });
        console.log("Fetched devices:", devices);

        // Set interval to refresh data
        if (devices_intervals !== undefined) {
            clearInterval(devices_intervals);
        }
        devices_intervals = setInterval(() => {
            listenForDevice(`${endpoint}/record?deviceID=`, id);
        }, timeIntervals);
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

// Function to export data to CSV
function exportToCSV(data, filename = "device_data.csv") {
    const csvRows = ["Time,CPS"];
    data.forEach(row => {
        const date = new Date(row.timeStamp * 1000).toLocaleString();
        csvRows.push(`${date},${row.Cps}`);
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to export data to XLSX
async function exportToXLSX(data, filename = "device_data.xlsx") {
    if (typeof XLSX === "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    // Prepare data for Excel with separate "Time" and "CPS" columns
    const wsData = [["Time", "CPS"]]; // Header row
    data.forEach(row => {
        const time = new Date(row.timeStamp * 1000).toLocaleString(); // Convert timestamp to readable date
        wsData.push([time, row.Cps]); // Each entry as a row in the spreadsheet
    });

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Device Data");

    // Export the Excel file
    XLSX.writeFile(wb, filename);
}

function exportToTSV(data, filename = "device_data.tsv") {
    const tsvRows = ["Time\tCPS"];

    data.forEach(row => {
        const date = new Date(row.timeStamp * 1000);
        const time = date.toISOString().replace("T", " ").substring(0, 19); // e.g., "2025-05-24 15:20:00"
        tsvRows.push(`${time}\t${row.Cps}`);
    });

    const tsvString = tsvRows.join("\n");
    const blob = new Blob([tsvString], { type: "text/tab-separated-values" });
    const link = document.createElement("a");

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// Event listener for DOM content loaded
document.addEventListener("DOMContentLoaded", function () {
    const exportBtn = document.getElementById("exportBtn");
    if (exportBtn) {
        exportBtn.addEventListener("click", exportDeviceData);
    } else {
        console.error("Export button not found!");
    }
});

async function fetchAndExportData(format) {
    if (!CURRENT_SELECTED_DEVICE_ID) {
        alert("Please select a device before exporting data.");
        return;
    }

    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (!startTime || !endTime) {
        alert("Please select a valid time range.");
        return;
    }

    const apiUrl = `${endpoint}/record?deviceID=${CURRENT_SELECTED_DEVICE_ID}&startTime=${new Date(startTime).getTime() / 1000}&endTime=${new Date(endTime).getTime() / 1000}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        if (!data.length) {
            alert("No data found for the selected period.");
            return;
        }

        if (format === "csv") {
            exportToCSV(data, `Device_${CURRENT_SELECTED_DEVICE_ID}_Data.csv`);
        } else if (format === "xlsx") {
            await exportToXLSX(data, `Device_${CURRENT_SELECTED_DEVICE_ID}_Data.xlsx`);
        } else if (format === "tsv") {
            await exportToTSV(data, `Device_${CURRENT_SELECTED_DEVICE_ID}_Data.tsv`);
        }
    } catch (error) {
        console.error("Export Error:", error);
        alert("An error occurred while exporting data.");
    }
}

async function listenForDevice(apiUrl, id) {
    try {
        apiUrl += id;
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error('Http error! Status : ${response.status}$');
        }
        const data = await response.json();
        if (data.error) {
            console.warn("API Error:", data.error);
            return null;
        }

        const devices = Array.isArray(data) ? data : [data];
        console.log(devices.length);
        if (xArray.length > 0) {
            let num = parseInt(devices[devices.length - 1].timeStamp);
            const date = new Date(num * 1000);
            if (date.getTime() === xArray[xArray.length - 1].getTime()) {
                console.warn("data old");
                return null;
            } else {
                console.warn("data new");
                console.warn(date, xArray[xArray.length - 1]);
            }
        }
        devices.forEach(device => {
            const myUnixTimestamp = device.timeStamp; // start with a Unix timestamp
            const myDate = new Date(myUnixTimestamp * 1000); // convert timestamp to milliseconds and construct Date object
            if (xArray.length > 0 && xArray[xArray.length - 1] >= myDate) {
                // Do nothing if data is old
            } else {
                console.log("added new data");
                xArray.push(myDate);
                yArray.push(parseInt(device.Cps).toString());
            }
        });

        // Display using Plotly
        Plotly.redraw("myPlot");
        console.log("Fetched devices:", devices);
    } catch (error) {
        console.error("Error fetching data: ", error);
    }
}

// Initial fetch of device data
fecthDevice(`${endpoint}/device`);

// Function to export all devices data in the selected format
async function exportAllDevicesData(format) {
    try {
        const startTime = document.getElementById("startTime").value;
        const endTime = document.getElementById("endTime").value;

        if (!startTime || !endTime) {
            alert("Please select a valid time range.");
            return;
        }

        // Fetch all devices
        const response = await fetch(`${endpoint}/device`);
        if (!response.ok) throw new Error("Failed to fetch devices");

        const devices = await response.json();
        if (!devices.length) {
            alert("No devices found.");
            return;
        }

        // Fetch data for each device within the selected time range
        const allDeviceData = {};
        for (let device of devices) {
            const apiUrl = `${endpoint}/record?deviceID=${device.deviceID}&startTime=${new Date(startTime).getTime() / 1000}&endTime=${new Date(endTime).getTime() / 1000}`;
            const deviceResponse = await fetch(apiUrl);
            if (!deviceResponse.ok) continue;

            const deviceData = await deviceResponse.json();
            allDeviceData[device.deviceID] = {
                name: device.deviceName,
                records: deviceData.map(row => ({
                    time: new Date(row.timeStamp * 1000).toLocaleString(),
                    cps: row.Cps
                }))
            };
        }

        if (Object.keys(allDeviceData).length === 0) {
            alert("No data found for the selected period.");
            return;
        }

        // Export the data in the selected format
        if (format === "csv") {
            exportAllDevicesToCSV(allDeviceData);
        } else if (format === "xlsx") {
            exportAllDevicesToXLSX(allDeviceData);
        } else if (format === "tsv") {
            exportAllDevicesToTSV(allDeviceData);
        }
    } catch (error) {
        console.error("Export Error:", error);
        alert("An error occurred while exporting data.");
    }
}

// Function to export all devices data to CSV
function exportAllDevicesToCSV(allDeviceData) {
    let csvRows = [];

    // First row: Device names (with an empty column between each)
    let headerRow = [];
    for (let deviceID in allDeviceData) {
        headerRow.push(allDeviceData[deviceID].name, ""); // Empty column
    }
    csvRows.push(headerRow.join(","));

    // Second row: Column headers (Time, CPS) for each device
    let subHeaderRow = [];
    for (let deviceID in allDeviceData) {
        subHeaderRow.push("Time", "CPS", ""); // Empty column
    }
    csvRows.push(subHeaderRow.join(","));

    // Determine the max number of records across all devices
    let maxRecords = Math.max(...Object.values(allDeviceData).map(d => d.records.length));

    // Populate the data rows
    for (let i = 0; i < maxRecords; i++) {
        let row = [];
        for (let deviceID in allDeviceData) {
            let record = allDeviceData[deviceID].records[i] || { time: "", cps: "" };
            row.push(record.time, record.cps, ""); // Empty column
        }
        csvRows.push(row.join(","));
    }

    // Convert to CSV file and trigger download
    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "All_Devices_Data.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Function to export all devices data to XLSX
async function exportAllDevicesToXLSX(allDeviceData) {
    if (typeof XLSX === "undefined") {
        const script = document.createElement("script");
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
        document.head.appendChild(script);
        await new Promise(resolve => script.onload = resolve);
    }

    let wsData = [];

    // First row: Device names (with an empty column between each device)
    let headerRow = [];
    for (let deviceID in allDeviceData) {
        headerRow.push(allDeviceData[deviceID].name, ""); // Empty column
    }
    wsData.push(headerRow);

    // Second row: Column headers for each device (Time, CPS)
    let subHeaderRow = [];
    for (let deviceID in allDeviceData) {
        subHeaderRow.push("Time", "CPS");
    }
    wsData.push(subHeaderRow);

    // Determine the max number of records across all devices
    let maxRecords = Math.max(...Object.values(allDeviceData).map(d => d.records.length));

    // Populate the data rows
    for (let i = 0; i < maxRecords; i++) {
        let row = [];
        for (let deviceID in allDeviceData) {
            let record = allDeviceData[deviceID].records[i] || { time: "", cps: "" };
            row.push(record.time, record.cps);
        }
        wsData.push(row);
    }

    // Create worksheet and workbook
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All Devices Data");

    // Export the Excel file
    XLSX.writeFile(wb, "All_Devices_Data.xlsx");
}

function exportAllDevicesToTSV(allDeviceData) {
    let tsvRows = [];

    // First row: Device names (with an empty column between each)
    let headerRow = [];
    for (let deviceID in allDeviceData) {
        headerRow.push(allDeviceData[deviceID].name, ""); // Empty column
    }
    tsvRows.push(headerRow.join("\t"));

    // Second row: Column headers (Time, CPS) for each device
    let subHeaderRow = [];
    for (let deviceID in allDeviceData) {
        subHeaderRow.push("Time", "CPS", ""); // Empty column
    }
    tsvRows.push(subHeaderRow.join("\t"));

    // Determine the max number of records across all devices
    let maxRecords = Math.max(...Object.values(allDeviceData).map(d => d.records.length));

    // Populate the data rows
    for (let i = 0; i < maxRecords; i++) {
        let row = [];
        for (let deviceID in allDeviceData) {
            let record = allDeviceData[deviceID].records[i] || { time: "", cps: "" };
            row.push(record.time, record.cps, ""); // Empty column
        }
        tsvRows.push(row.join("\t"));
    }

    // Convert to TSV file and trigger download
    const tsvString = tsvRows.join("\n");
    const blob = new Blob([tsvString], { type: "text/tab-separated-values" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "All_Devices_Data.tsv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// API endpoint — use the local server (same origin)
const SC_ENDPOINT = '';

// Refresh interval in milliseconds
const SC_REFRESH_INTERVAL = 5000;

let scRefreshTimer = null;

async function fetchAllRecords() {
    const tableBody = document.getElementById('signalTableBody');
    const statusEl = document.getElementById('signalStatus');

    try {
        const response = await fetch(`${SC_ENDPOINT}/record`);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        if (data.error) {
            tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-warning">${data.error}</td></tr>`;
            statusEl.textContent = 'No data available.';
            return;
        }

        const records = Array.isArray(data) ? data : [data];

        tableBody.innerHTML = '';
        records.forEach(record => {
            const date = new Date(record.timeStamp * 1000);
            const formattedTime = date.toLocaleString();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${record.deviceID}</td>
                <td>${formattedTime}</td>
                <td>${record.Cps}</td>
                <td>${record.uSv}</td>
            `;
            tableBody.appendChild(tr);
        });

        statusEl.textContent = `Last updated: ${new Date().toLocaleTimeString()} — ${records.length} record(s)`;
    } catch (error) {
        console.error('Error fetching records:', error);
        tableBody.innerHTML = `<tr><td colspan="4" class="text-center text-danger">Failed to load data. Check console for details.</td></tr>`;
        statusEl.textContent = 'Error loading data.';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    fetchAllRecords();
    scRefreshTimer = setInterval(fetchAllRecords, SC_REFRESH_INTERVAL);
});

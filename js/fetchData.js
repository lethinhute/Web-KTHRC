async function fetchData(apiUrl) {
    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Kiểm tra nếu dữ liệu không tồn tại
        if (data.error) {
            console.warn("API Error:", data.error);
            return null;
        }
        
        // Trích xuất các thành phần từ JSON
        const deviceID = data.deviceID;
        const timeStamp = data.timeStamp;
        const Cps = data.Cps;
        const uSv = data.uSv;
        
        console.log("Device ID:", deviceID);
        console.log("Timestamp:", timeStamp);
        console.log("Cps:", Cps);
        console.log("uSv:", uSv);
        
        return { deviceID, timeStamp, Cps, uSv };
    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

// Gọi API với URL (thay thế bằng URL thực tế của bạn)
fetchData('http://localhost:5000/record?deviceID=**string**&day=**int**&month=**int**&year=**int**&Cps=**real**&uSv:**real**');
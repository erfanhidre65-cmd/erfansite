document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // بخش اول: تشخیص اطلاعات سیستم، مرورگر و باتری
    // ==========================================
    const detectDevice = async () => {
        const ua = navigator.userAgent;
        let platform = "Desktop";
        if (/Mobile|Android|iP(hone|od|ad)/i.test(ua)) platform = "Mobile Device";
        else if (/Tablet|iPad/i.test(ua)) platform = "Tablet";

        let os = "Unknown OS";
        if (/Windows/i.test(ua)) os = "Windows";
        else if (/Mac OS X/i.test(ua)) os = "macOS / iOS";
        else if (/Android/i.test(ua)) os = "Android";
        else if (/Linux/i.test(ua)) os = "Linux";
        if (/iPhone/i.test(ua)) os = "iOS (iPhone)";
        if (/iPad/i.test(ua)) os = "iOS (iPad)";

        let browser = "Unknown Browser";
        if (/Edg/i.test(ua)) browser = "Microsoft Edge";
        else if (/Chrome/i.test(ua)) browser = "Google Chrome";
        else if (/Firefox/i.test(ua)) browser = "Mozilla Firefox";
        else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Apple Safari";

        document.getElementById('devicePlatform').textContent = platform;
        document.getElementById('deviceOS').textContent = os;
        document.getElementById('deviceBrowser').textContent = browser;
        document.getElementById('headerDeviceType').textContent = platform;

        // دریافت وضعیت باتری (در صورت پشتیبانی مرورگر)
        const batteryEl = document.getElementById('batteryStatus');
        if (navigator.getBattery) {
            try {
                const battery = await navigator.getBattery();
                const updateBattery = () => {
                    const level = Math.round(battery.level * 100);
                    const charging = battery.charging ? '⚡ Charging' : '🔋 Discharging';
                    batteryEl.textContent = `${level}% (${charging})`;
                };
                updateBattery();
                battery.addEventListener('levelchange', updateBattery);
                battery.addEventListener('chargingchange', updateBattery);
            } catch (e) {
                batteryEl.textContent = 'N/A';
            }
        } else {
            batteryEl.textContent = 'Not Supported';
        }
    };
    detectDevice();

    // ==========================================
    // بخش دوم: ویجت شبکه، IP و پینگ هوشمند
    // ==========================================
    const fetchUserIP = async () => {
        const ipEl = document.getElementById('ipAddress');
        if (!navigator.onLine) return;
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            ipEl.textContent = data.ip; 
        } catch (error) {
            ipEl.textContent = 'Unavailable';
        }
    };

    const measurePing = async () => {
        const pingEl = document.getElementById('pingValue');
        if (!navigator.onLine) {
            pingEl.textContent = 'Offline';
            return;
        }
        const start = performance.now();
        try {
            await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
            const end = performance.now();
            const latency = Math.round(end - start);
            pingEl.textContent = `${latency} ms`;
            pingEl.style.color = latency < 100 ? '#10b981' : (latency < 200 ? '#f59e0b' : '#ef4444');
        } catch (error) {
            pingEl.textContent = 'Error';
        }
    };

    let currentSpeed = 0; 
    let speedChartInstance = null;

    const updateNetworkStatus = () => {
        const onlineStatusEl = document.getElementById('onlineStatus');
        const connectionTypeEl = document.getElementById('connectionType');
        const networkGenEl = document.getElementById('networkGen');
        const widgetEl = document.getElementById('networkWidget');

        if (navigator.onLine) {
            onlineStatusEl.textContent = 'Online';
            onlineStatusEl.className = 'status-online';
            widgetEl.classList.remove('offline-mode');

            if (navigator.connection) {
                const conn = navigator.connection;
                currentSpeed = conn.downlink ? conn.downlink : 0;
                
                let typeStr = conn.type || 'Unknown';
                let isCellular = typeStr === 'cellular';
                let isWifi = typeStr === 'wifi' || typeStr === 'ethernet';

                if (isCellular) connectionTypeEl.textContent = 'Mobile Data';
                else if (isWifi) connectionTypeEl.textContent = 'WiFi / LAN';
                else connectionTypeEl.textContent = typeStr;
                
                let baseGen = conn.effectiveType ? conn.effectiveType.toUpperCase() : 'N/A';
                let finalGenDisplay = baseGen;

                if (isCellular || typeStr === 'Unknown') {
                    if (currentSpeed >= 50) finalGenDisplay = '5G / 4G+ (Estimated)';
                    else if (currentSpeed >= 15) finalGenDisplay = '4G LTE';
                } else if (isWifi) {
                    if (currentSpeed >= 100) finalGenDisplay = 'Fiber / BroadBand';
                    else finalGenDisplay = 'Standard WiFi';
                }

                networkGenEl.textContent = finalGenDisplay;
            } else {
                connectionTypeEl.textContent = 'Not Supported';
                networkGenEl.textContent = 'N/A';
                currentSpeed = 0;
            }
            
            fetchUserIP(); 
            measurePing();
            setInterval(measurePing, 10000); 

        } else {
            onlineStatusEl.textContent = 'Offline';
            onlineStatusEl.className = 'status-offline';
            connectionTypeEl.textContent = 'None';
            networkGenEl.textContent = 'Disconnected';
            currentSpeed = 0;
            document.getElementById('ipAddress').textContent = 'Offline'; 
            document.getElementById('pingValue').textContent = 'Offline';
            widgetEl.classList.add('offline-mode');
        }

        updateSpeedometerUI();
    };

    // ==========================================
    // بخش سوم: رسم کیلومترشمار سرعت (Speedometer)
    // ==========================================
    const initSpeedometer = () => {
        const ctxSpeed = document.getElementById('speedChart').getContext('2d');
        speedChartInstance = new Chart(ctxSpeed, {
            type: 'doughnut',
            data: {
                labels: ['Slow', 'Medium', 'Fast'],
                datasets: [{
                    data: [20, 50, 100],
                    backgroundColor: ['#ef4444', '#f59e0b', '#10b981'],
                    borderWidth: 0,
                    cutout: '80%',
                    circumference: 180,
                    rotation: -90
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                animation: { animateRotate: true, duration: 1500, easing: 'easeOutQuart' }
            }
        });
    };

    const updateSpeedometerUI = () => {
        const speedDisplay = document.getElementById('mainSpeedDisplay');
        speedDisplay.textContent = currentSpeed;
        if(currentSpeed < 10) speedDisplay.style.color = '#ef4444';
        else if(currentSpeed < 50) speedDisplay.style.color = '#f59e0b';
        else speedDisplay.style.color = '#10b981';
    };

    if (typeof Chart !== 'undefined') initSpeedometer();
    updateNetworkStatus();

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    if (navigator.connection) navigator.connection.addEventListener('change', updateNetworkStatus);
});
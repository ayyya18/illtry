// Data layer: Firebase refs, listeners and data helpers
(function () {
    const App = window.App = window.App || {};
    const database = App.database;

    let sensorRef = null;
    let weatherref = null;
    let notificationsRef = null;
    let weatherUpdateInterval = null;

    function checkSoilAcidity(snapshot) {
        const data = snapshot.val();
        if (!data || data.ph === undefined || !notificationsRef || !sensorRef) return;
        const phValue = parseFloat(data.ph);
        const lastNotifiedStatus = data.ph_status || 'netral';
        let currentStatus = 'netral';
        let notificationText = null;
        if (phValue < 6.5) {
            currentStatus = 'asam';
            notificationText = "Tanah terlalu masam, segera lakukan tindakan untuk mengembalikan kondisi tanah menjadi netral";
        } else if (phValue > 7.5) {
            currentStatus = 'basa';
            notificationText = "Tanah terlalu basa, segera lakukan tindakan untuk mengembalikan kondisi tanah menjadi netral";
        }
        if (currentStatus !== lastNotifiedStatus) {
            if (currentStatus !== 'netral') {
                notificationsRef.push({
                    text: notificationText,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    read: false,
                });
            }
            sensorRef.update({ ph_status: currentStatus });
        }
    }

    function tampilkanData(snapshot) {
        const data = snapshot.val();
        const el = (id, value) => { const e = document.getElementById(id); if (e) e.textContent = value; };
        if (data) {
            el('temperature', data.temperature ?? "N/A");
            el('humidity', data.humidity ?? "N/A");
            el('ph', data.ph ?? "N/A");
            el('lightIntensity', data.lightIntensity ?? "N/A");
            el('waterlevel', data.waterlevel ?? "N/A");
            el('tds', data.tds ?? "N/A");
            el('waterTemp', data.waterTemp ?? "N/A");
            el('waterPh', data.waterPh ?? "N/A");
            el('dissolvedO2', data.dissolvedO2 ?? "N/A");
            el('salinity', data.salinity ?? "N/A");
        } else {
            ["temperature", "humidity", "ph", "lightIntensity", "waterlevel", "tds", "waterTemp", "waterPh", "dissolvedO2", "salinity"].forEach(id => el(id, "Data Kosong"));
        }
    }

    function tampilkanCuaca(snapshot) {
        const data = snapshot.val();
        const el = (id, value) => { const e = document.getElementById(id); if (e) e.textContent = value; };
        if (data) {
            el('suhu', data.suhu ?? "N/A");
            el('kecepatanAngin', data.kecepatanAngin ?? "N/A");
            el('deskripsi', data.deskripsi || "N/A");
            el('hujan', data.hujan ?? "0");
            el('kelembaban', data.kelembaban ?? "N/A");
        } else {
            ["suhu", "kecepatanAngin", "deskripsi", "hujan", "kelembaban"].forEach(id => el(id, "Data Kosong"));
        }
    }

    function displayNotifications(snapshot) {
        const dropdownMenu = document.querySelector('.user-menu .dropdown-menu');
        if (!dropdownMenu) return;
        const footer = dropdownMenu.querySelector('.dropdown-footer');
        const badge = document.querySelector('.notification-badge');
        dropdownMenu.querySelectorAll('.notification-item, .no-notification-message').forEach(el => el.remove());
        const notifications = snapshot.val();
        let count = 0;
        if (notifications) {
            const keys = Object.keys(notifications).reverse();
            count = keys.length;
            keys.forEach(key => {
                const notification = notifications[key];
                const item = document.createElement('a');
                item.href = "#";
                item.className = 'notification-item';
                item.innerHTML = `<span class="notification-text">${notification.text}</span><span class="notification-time">${new Date(notification.timestamp).toLocaleString('id-ID')}</span>`;
                dropdownMenu.insertBefore(item, footer);
            });
        }
        if (count === 0) {
            const noMsg = document.createElement('div');
            noMsg.className = 'no-notification-message';
            noMsg.textContent = 'Tidak ada notifikasi baru';
            noMsg.style.cssText = 'text-align: center; padding: 20px; font-size: 0.45em; opacity: 0.7;';
            dropdownMenu.insertBefore(noMsg, footer);
            badge.style.display = 'none';
        } else {
            badge.textContent = count;
            badge.style.display = 'flex';
        }
    }

    function updateWeatherFromAPI(city) {
        if (!city) return;
        const weatherDataRefForAPI = database.ref(`/lokasi/${city}/cuaca`);
        weatherDataRefForAPI.once('value', (snapshot) => {
            const cachedData = snapshot.val();
            if (cachedData && cachedData.timestamp && (Date.now() - cachedData.timestamp) < 900000) return;
            fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${App.openWeatherApiKey}&units=metric&lang=id`)
                .then(res => res.json())
                .then(data => {
                    if (data.cod !== 200) throw new Error(data.message);
                    const weatherData = {
                        suhu: Math.round(data.main.temp),
                        kecepatanAngin: data.wind.speed,
                        deskripsi: data.weather[0].description,
                        kelembaban: data.main.humidity,
                        hujan: data.rain?.['1h'] ?? 0,
                        timestamp: Date.now()
                    };
                    weatherDataRefForAPI.set(weatherData);
                }).catch(err => console.error(`Gagal update cuaca untuk ${city}:`, err));
        });
    }

    function loadDataForLocation(locationName) {
        if (!locationName) return;
        if (sensorRef) sensorRef.off();
        if (weatherref) weatherref.off();
        if (notificationsRef) notificationsRef.off();
        if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
        const basePath = `/lokasi/${locationName}`;
        sensorRef = database.ref(`${basePath}/sensor`);
        weatherref = database.ref(`${basePath}/cuaca`);
        notificationsRef = database.ref(`${basePath}/notifications`);
        sensorRef.on('value', (snap) => { tampilkanData(snap); App.ui && App.ui.updateSlidesFromData && App.ui.updateSlidesFromData(snap.val() || {}); checkSoilAcidity(snap); });
        weatherref.on('value', (snap) => { tampilkanCuaca(snap); App.ui && App.ui.updateSlidesFromData && App.ui.updateSlidesFromData(snap.val() || {}); });
        notificationsRef.on('value', displayNotifications);
        updateWeatherFromAPI(locationName);
        weatherUpdateInterval = setInterval(() => updateWeatherFromAPI(locationName), 900000);
    }

    function exportNotificationsToExcel() {
        if (!notificationsRef) { alert("Pilih lokasi terlebih dahulu."); return; }
        notificationsRef.once('value', (snapshot) => {
            const notifications = snapshot.val();
            if (!notifications) { alert("Tidak ada notifikasi untuk diekspor."); return; }
            const dataForExcel = Object.values(notifications).map(n => ({
                'Waktu': new Date(n.timestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' }),
                'Pesan Notifikasi': n.text
            })).reverse();
            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
            worksheet['!cols'] = [{ wch: 30 }, { wch: 80 }];
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Notifikasi");
            XLSX.writeFile(workbook, `Riwayat_Notifikasi_${localStorage.getItem('currentLocation') || 'dashboard'}.xlsx`);
        }).catch(error => console.error("Gagal mengekspor:", error));
    }

    function clearNotifications() {
        if (!notificationsRef) { alert("Pilih lokasi terlebih dahulu."); return; }
        if (confirm("Yakin ingin menghapus semua notifikasi untuk lokasi ini?")) {
            notificationsRef.remove().catch(err => console.error('Gagal menghapus notifikasi', err));
        }
    }

    App.data = {
        loadDataForLocation,
        exportNotificationsToExcel,
        clearNotifications
    };
})();

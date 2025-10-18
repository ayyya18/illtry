window.ChartApp = window.ChartApp || {};
(function(ns){
    ns.lastRawData = null; // Tetap simpan data mentah

    ns.fetchChartData = async function({ location, dataType, range } = {}){
        const base = ns.GOOGLE_SHEET_WEB_APP_URL || '';
        if (!base || base.includes("GANTI_DENGAN")) {
             throw new Error('GOOGLE_SHEET_WEB_APP_URL belum diatur di charts-config.js');
        }

        if (!location || !dataType || !range) {
            throw new Error("Parameter tidak lengkap (dibutuhkan: location, dataType, range).");
        }

        // --- PERBAIKAN UTAMA DI SINI ---
        // Panggil fungsi pemetaan BARU untuk mendapatkan parameter yang benar untuk GAS
        const gasDataTypeParam = mapHtmlValueToGasParam(dataType);
        if (!gasDataTypeParam) {
            // Jika pemetaan gagal, gunakan nilai asli sebagai fallback (sesuai GAS lama)
            // Atau berikan error jika nilai asli tidak valid
             console.warn(`Pemetaan dataType gagal untuk: '${dataType}'. Mencoba menggunakan nilai asli.`);
             // throw new Error(`Tipe data dropdown tidak valid: ${dataType}`); // Alternatif jika ingin error
        }
        // Kirim parameter yang sudah dipetakan (atau nilai asli jika pemetaan gagal)
        const finalDataTypeParam = gasDataTypeParam || dataType;
        // --- AKHIR PERBAIKAN ---

        const url = `${base}?range=${encodeURIComponent(range)}&dataType=${encodeURIComponent(finalDataTypeParam)}&location=${encodeURIComponent(location)}`;

        console.log("Fetching data from:", url);

        try {
            const res = await fetch(url);
            if (!res.ok) {
                let errorMsg = `Gagal menghubungi server grafik (Status: ${res.status})`;
                try { const errorJson = await res.json(); errorMsg = errorJson.message || errorMsg; } catch (e) {}
                throw new Error(errorMsg);
            }

            const result = await res.json();
            if (result.status !== 'success') {
                // Tambahkan detail error dari GAS jika ada
                throw new Error(result.message || 'Gagal memuat data grafik dari Apps Script.');
            }

            ns.lastRawData = result.data || [];
            return result;

        } catch (error) {
            console.error("Error fetching chart data:", error);
            ns.lastRawData = null;
            throw error;
        }
    };

    // Fungsi BANTUAN BARU untuk memetakan data-value HTML ke kunci parameter GAS
    function mapHtmlValueToGasParam(htmlValue) {
        // Pemetaan ini HARUS sesuai:
        // Kiri (key): Nilai data-value di charts.html
        // Kanan (value): Kunci yang dikenali oleh getColumnHeader di GAS Anda
        const map = {
            'Suhu Udara (°C)': 'suhuUdara',
            'Kecepatan Angin (km/h)': 'kecepatanAngin',
            'Kelembaban Udara (%)': 'kelembabanUdara',
            'Suhu Tanah (°C)': 'temperature', // Perhatikan, di GAS 'temperature'
            'Kelembaban Tanah (%)': 'humidity', // Perhatikan, di GAS 'humidity'
            'Level Air (mm)': 'waterlevel',
            'pH Tanah': 'phTanah',
            'Intensitas Cahaya (lux)': 'lightIntensity',
            'TDS (ppm)': 'tds',
            'Suhu Air (°C)': 'waterTemp',
            'pH Air': 'waterPh',
            'Dissolved O2 (mg/L)': 'dissolvedO2',
            'Salinitas (ppt)': 'salinitas'
        };
        return map[htmlValue] || null; // Kembalikan kunci GAS atau null jika tidak cocok
    }

})(window.ChartApp);
window.ChartApp = window.ChartApp || {};
(function(ns){
    // Variabel untuk menyimpan data mentah terakhir kali diambil
    ns.lastRawData = null;

    ns.fetchChartData = async function({ location, dataType, range } = {}){
        const base = ns.GOOGLE_SHEET_WEB_APP_URL || '';
        if (!base || base.includes("GANTI_DENGAN")) {
             throw new Error('GOOGLE_SHEET_WEB_APP_URL belum diatur di charts-config.js');
        }

        if (!location || !dataType || !range) {
            throw new Error("Parameter tidak lengkap (dibutuhkan: location, dataType, range).");
        }
        
        // Gunakan parameter dataType yang sesuai dengan input GAS (e.g., suhuUdara)
        // Kita perlu memetakan kembali nilai dropdown HTML ke kunci parameter GAS
        const gasDataTypeParam = mapHtmlValueToGasParam(dataType);
        if (!gasDataTypeParam) {
            throw new Error(`Tipe data tidak valid: ${dataType}`);
        }

        const url = `${base}?range=${encodeURIComponent(range)}&dataType=${encodeURIComponent(gasDataTypeParam)}&location=${encodeURIComponent(location)}`;
        
        console.log("Fetching data from:", url); // Log URL untuk debugging

        try {
            const res = await fetch(url);
            if (!res.ok) {
                let errorMsg = `Gagal menghubungi server grafik (Status: ${res.status})`;
                try { const errorJson = await res.json(); errorMsg = errorJson.message || errorMsg; } catch (e) {}
                throw new Error(errorMsg);
            }
            
            const result = await res.json();
            if (result.status !== 'success') {
                throw new Error(result.message || 'Gagal memuat data grafik dari Apps Script.');
            }

            // Simpan data mentah yang diterima dari GAS
            ns.lastRawData = result.data || []; 
            
            // Kembalikan hasil lengkap termasuk label dari GAS
            return result; 

        } catch (error) {
            console.error("Error fetching chart data:", error);
            ns.lastRawData = null; // Reset data mentah jika gagal
            throw error;
        }
    };

    // Fungsi bantuan untuk memetakan nilai dropdown HTML ke parameter GAS
    function mapHtmlValueToGasParam(htmlValue) {
        // Pemetaan ini HARUS SESUAI dengan data-value di HTML dan KUNCI di getColumnHeader GAS Anda
        const map = {
            'Suhu Udara (°C)': 'suhuUdara',
            'Kecepatan Angin (km/h)': 'kecepatanAngin',
            'Kelembaban Udara (%)': 'kelembabanUdara',
            'Suhu Tanah (°C)': 'temperature',
            'Kelembaban Tanah (%)': 'humidity',
            'Level Air (mm)': 'waterlevel',
            'pH Tanah': 'phTanah',
            'Intensitas Cahaya (lux)': 'lightIntensity',
            'TDS (ppm)': 'tds',
            'Suhu Air (°C)': 'waterTemp',
            'pH Air': 'waterPh',
            'Dissolved O2 (mg/L)': 'dissolvedO2',
            'Salinitas (ppt)': 'salinitas'
        };
        // Cari berdasarkan nilai teks header (yang ada di data-value HTML)
        return Object.keys(map).find(key => map[key] === Object.keys(map).find(k => k === htmlValue)) 
               ? map[htmlValue] // Jika htmlValue cocok dengan header, kembalikan kuncinya
               : null; // Atau kembalikan null jika tidak ditemukan
    }

})(window.ChartApp);
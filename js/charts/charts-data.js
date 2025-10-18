window.ChartApp = window.ChartApp || {};
(function(ns){
    ns.fetchChartData = async function({ location, dataType, range } = {}){
        const base = ns.GOOGLE_SHEET_WEB_APP_URL || '';
        if (!base || base.includes("GANTI_DENGAN")) {
             throw new Error('GOOGLE_SHEET_WEB_APP_URL belum diatur di charts-config.js');
        }

        // Pastikan parameter dikirim
        if (!location || !dataType || !range) {
            throw new Error("Parameter tidak lengkap untuk fetchChartData.");
        }

        const url = `${base}?range=${encodeURIComponent(range)}&dataType=${encodeURIComponent(dataType)}&location=${encodeURIComponent(location)}`;
        
        console.log("Fetching data from:", url); // Log URL untuk debugging

        try {
            const res = await fetch(url);
            if (!res.ok) {
                // Coba baca pesan error dari GAS jika ada
                let errorMsg = `Gagal menghubungi server grafik (Status: ${res.status})`;
                try {
                    const errorJson = await res.json();
                    errorMsg = errorJson.message || errorMsg;
                } catch (e) { /* Abaikan jika respons bukan JSON */ }
                throw new Error(errorMsg);
            }
            
            const result = await res.json();
            if (result.status !== 'success') {
                throw new Error(result.message || 'Gagal memuat data grafik dari Apps Script.');
            }
            
            // Konversi format waktu jika Apps Script mengembalikan array [HH:mm, dd MMM]
            if (result.data.length > 0 && Array.isArray(result.data[0].time)) {
                result.data.forEach(item => {
                    item.time = item.time[0]; // Ambil hanya bagian jam (HH:mm)
                });
            }

            return result; // { status, label, data }

        } catch (error) {
            console.error("Error fetching chart data:", error);
            throw error; // Lemparkan error agar bisa ditangkap oleh UI
        }
    };
})(window.ChartApp);
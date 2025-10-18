window.ChartApp = window.ChartApp || {};
(function(ns){
    // DOM refs (tidak berubah)
    ns.loadingSpinner = ns.q('#loading-spinner');
    ns.dataChartCanvas = ns.q('#dataChart');
    ns.zoomInBtn = ns.q('#zoom-in-btn');
    ns.zoomOutBtn = ns.q('#zoom-out-btn');
    ns.zoomResetBtn = ns.q('#zoom-reset-btn');

    ns.currentFilters = {
        location: 'surabaya',
        dataType: 'Suhu Udara (°C)',
        range: '5'
    };

    /**
     * Memfilter data mentah hanya untuk hari terakhir.
     * Asumsi format waktu dari GAS adalah array [HH:mm, dd MMM].
     */
    function filterDataForLatestDay(rawData) {
        if (!rawData || rawData.length === 0) return [];

        let latestDateStr = "";
        // Cari tanggal terakhir dari data (format 'dd MMM')
        // Iterasi dari belakang untuk efisiensi
        for (let i = rawData.length - 1; i >= 0; i--) {
            if (Array.isArray(rawData[i].time) && rawData[i].time.length === 2) {
                latestDateStr = rawData[i].time[1]; // Ambil 'dd MMM'
                break; // Hentikan setelah tanggal terakhir ditemukan
            }
        }

        if (!latestDateStr) {
            console.warn("Tidak dapat menentukan tanggal terakhir dari data GAS. Menampilkan semua data.");
            return rawData; // Kembalikan semua jika format salah atau tidak ditemukan
        }

        console.log("Memfilter data untuk tanggal terakhir:", latestDateStr);

        // Filter data yang cocok dengan tanggal terakhir
        return rawData.filter(item =>
            Array.isArray(item.time) && item.time.length === 2 && item.time[1] === latestDateStr
        );
    }

    ns.loadChartData = async function(isReset = false){
        ns.showLoading(ns.loadingSpinner, ns.dataChartCanvas);
        try {
            // 1. Ambil data mentah (potensial > 1 hari) dari GAS
            // fetchChartData menyimpan data mentah ke ns.lastRawData
            const resultFromGAS = await ns.fetchChartData(ns.currentFilters);

            // 2. Filter data mentah untuk mendapatkan data HARI TERAKHIR saja
            const dailyData = filterDataForLatestDay(ns.lastRawData);

            // 3. TERAPKAN SAMPLING INTERVAL (range) pada DATA HARIAN
            let processedData = dailyData; // Mulai dengan data harian
            const range = ns.currentFilters.range;
            
            if (range !== 'all') {
                const interval = parseInt(range, 10);
                if (!isNaN(interval) && interval > 0 && dailyData.length > 0) {
                    // Logika sampling: Ambil data pertama, lalu setiap 'interval' data berikutnya
                    processedData = dailyData.filter((_, index) => index % interval === 0);
                     console.log(`Sampling data harian (Jumlah: ${dailyData.length}) dengan interval ${interval}, hasil: ${processedData.length} titik.`);
                } else {
                     console.log("Range 'all' dipilih atau interval tidak valid, menampilkan semua data harian.");
                     processedData = dailyData; // Jika 'all' atau interval tidak valid, pakai semua data harian
                }
            } else {
                 console.log("Range 'all' dipilih, menampilkan semua data harian.");
                 processedData = dailyData; // Jika 'all', pakai semua data harian
            }

            // 4. Siapkan label dan render grafik
            const chartLabel = `${resultFromGAS.label} - ${ns.currentFilters.location} (${dailyData.length > 0 && Array.isArray(dailyData[0].time) ? dailyData[0].time[1] : 'Hari Terakhir'})`; // Tambahkan tanggal ke label
            ns.renderChart(ns.dataChartCanvas, processedData, chartLabel);

            // 5. Reset zoom jika diminta (setelah rendering)
            if (isReset && ns._chart) {
                setTimeout(() => ns._chart?.resetZoom(), 100);
            }

        } catch (err) {
            alert(err.message || 'Terjadi error saat memuat atau memproses data.');
            if (ns._chart) { ns._chart.destroy(); ns._chart = null; }
        } finally {
            ns.hideLoading(ns.loadingSpinner, ns.dataChartCanvas);
        }
    };

    ns.setupEventListeners = function() {
        // Setup Dropdowns
        document.querySelectorAll('.custom-select-wrapper').forEach(wrapper => {
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const optionsContainer = wrapper.querySelector('.custom-options');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = optionsContainer.classList.contains('active');
                document.querySelectorAll('.custom-options.active').forEach(el => {
                    if (el !== optionsContainer) el.classList.remove('active');
                });
                optionsContainer.classList.toggle('active');
            });

            optionsContainer.querySelectorAll('.custom-option').forEach(option => {
                option.addEventListener('click', function() {
                    const currentActive = this.parentElement.querySelector('.active');
                    if(currentActive) currentActive.classList.remove('active');
                    this.classList.add('active');
                    trigger.textContent = this.querySelector('span') ? this.querySelector('span').textContent : this.textContent.trim();
                    optionsContainer.classList.remove('active');

                    const filterType = wrapper.id.replace('-filter', '');
                    const key = filterType === 'time-range' ? 'range' : filterType === 'data-type' ? 'dataType' : filterType;
                    ns.currentFilters[key] = this.getAttribute('data-value');

                    console.log("Filters updated:", ns.currentFilters);
                    ns.loadChartData(); // Muat ulang data saat filter berubah
                });
            });
        });
        window.addEventListener('click', () => {
            document.querySelectorAll('.custom-options.active').forEach(el => el.classList.remove('active'));
        });

        // Fungsikan Tombol Zoom
        ns.zoomInBtn.addEventListener('click', () => ns._chart?.zoom(1.1));
        ns.zoomOutBtn.addEventListener('click', () => ns._chart?.zoom(0.9));
        ns.zoomResetBtn.addEventListener('click', () => {
             console.log("Reset Zoom clicked");
             ns.loadChartData(true); // Muat ulang data (filter harian + sampling) DAN reset zoom
        });
    };

    ns.init = function(){
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            alert('Anda harus login terlebih dahulu!');
            window.location.href = 'index.html';
            return;
        }
        try {
            ns.currentFilters.location = ns.q('#location-filter .custom-option.active')?.getAttribute('data-value') || 'surabaya';
            ns.currentFilters.dataType = ns.q('#data-type-filter .custom-option.active')?.getAttribute('data-value') || 'Suhu Udara (°C)';
            ns.currentFilters.range = ns.q('#time-range-filter .custom-option.active')?.getAttribute('data-value') || '5';
            
            ns.q('#location-filter .custom-select-trigger').textContent = ns.q('#location-filter .custom-option.active span')?.textContent || 'Kota Surabaya';
            ns.q('#data-type-filter .custom-select-trigger').textContent = ns.q('#data-type-filter .custom-option.active span')?.textContent || 'Suhu Udara';
            ns.q('#time-range-filter .custom-select-trigger').textContent = ns.q('#time-range-filter .custom-option.active span')?.textContent || 'Per 5 Menit (Hari Terakhir)';

        } catch (e) {
            console.error("Gagal membaca filter awal.", e);
        }
        
        ns.setupEventListeners();
        ns.loadChartData(); // Muat data awal
    };
})(window.ChartApp);
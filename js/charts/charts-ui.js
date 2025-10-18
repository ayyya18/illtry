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
        try {
            // Cari tanggal terakhir dari data (format 'dd MMM')
            for (let i = rawData.length - 1; i >= 0; i--) {
                if (Array.isArray(rawData[i]?.time) && rawData[i].time.length === 2) {
                    latestDateStr = rawData[i].time[1]; // Ambil 'dd MMM'
                    break;
                }
            }
        } catch(e) { /* Abaikan jika error saat mencari tanggal */ }

        if (!latestDateStr) {
            console.warn("Format waktu tidak terduga atau tidak ada data hari ini. Menampilkan semua data yang diterima.");
            return rawData; // Kembalikan semua jika format salah/tanggal tak ditemukan
        }
        console.log("Memfilter data untuk tanggal terakhir:", latestDateStr);
        return rawData.filter(item =>
            Array.isArray(item?.time) && item.time.length === 2 && item.time[1] === latestDateStr
        );
    }

    ns.loadChartData = async function(isReset = false){
        ns.showLoading(ns.loadingSpinner, ns.dataChartCanvas);
        try {
            // 1. Ambil data dari GAS (GAS SUDAH melakukan sampling berdasarkan currentFilters.range)
            const resultFromGAS = await ns.fetchChartData(ns.currentFilters);
            ns.lastRawData = resultFromGAS.data || []; // Simpan data yang sudah disampling GAS

            // 2. Filter data yang diterima dari GAS hanya untuk hari terakhir
            const dailySampledData = filterDataForLatestDay(ns.lastRawData);

            // --- PERBAIKAN UTAMA: HAPUS SAMPLING CLIENT-SIDE ---
            // 3. Langsung gunakan data harian yang sudah disampling oleh GAS
            const processedData = dailySampledData;
            console.log(`Menggunakan data harian (Jumlah: ${dailySampledData.length}) yang sudah di-sampling oleh GAS.`);
            // --- AKHIR PERBAIKAN ---

            // 4. Siapkan label dan render grafik
            const chartLabel = `${resultFromGAS.label} - ${ns.currentFilters.location} (${dailySampledData.length > 0 && Array.isArray(dailySampledData[0]?.time) ? dailySampledData[0].time[1] : 'Hari Terakhir'})`;
            ns.renderChart(ns.dataChartCanvas, processedData, chartLabel);

            // 5. Reset zoom jika diminta
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
             ns.loadChartData(true); // Muat ulang data (filter harian) DAN reset zoom
        ns.panLeftBtn.addEventListener('click', () => {
            if (ns._chart) {
                // Geser ke kiri sebanyak 100 piksel
                ns._chart.pan({ x: 100 }, undefined, 'default');
            }
        });
        ns.panRightBtn.addEventListener('click', () => {
            if (ns._chart) {
                // Geser ke kanan sebanyak 100 piksel
                ns._chart.pan({ x: -100 }, undefined, 'default');
            }
        });
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
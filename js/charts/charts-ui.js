window.ChartApp = window.ChartApp || {};
(function(ns){
    // DOM refs
    ns.loadingSpinner = ns.q('#loading-spinner');
    ns.dataChartCanvas = ns.q('#dataChart');
    ns.zoomInBtn = ns.q('#zoom-in-btn');
    ns.zoomOutBtn = ns.q('#zoom-out-btn');
    ns.zoomResetBtn = ns.q('#zoom-reset-btn');

    ns.currentFilters = {
        location: 'surabaya',
        dataType: 'Suhu Udara (°C)', // Harus cocok dengan data-value awal di HTML
        range: '5'
    };

    /**
     * Fungsi untuk memfilter data mentah hanya untuk hari terakhir.
     * Asumsi format waktu dari GAS adalah array [HH:mm, dd MMM].
     */
    function filterDataForLatestDay(rawData) {
        if (!rawData || rawData.length === 0) return [];

        // Cari tanggal terakhir (format 'dd MMM') dari data
        let latestDateStr = "";
        if (Array.isArray(rawData[rawData.length - 1].time) && rawData[rawData.length - 1].time.length === 2) {
             latestDateStr = rawData[rawData.length - 1].time[1]; // Ambil 'dd MMM' dari data terakhir
        } else {
            console.warn("Format waktu tidak terduga dari GAS, tidak dapat memfilter harian.");
            return rawData; // Kembalikan semua jika format salah
        }
       
        // Filter data yang cocok dengan tanggal terakhir
        return rawData.filter(item => 
            Array.isArray(item.time) && item.time.length === 2 && item.time[1] === latestDateStr
        );
    }

    ns.loadChartData = async function(isReset = false){
        ns.showLoading(ns.loadingSpinner, ns.dataChartCanvas);
        try {
            // 1. Ambil data (potensial > 1 hari) dari GAS
            // fetchChartData akan menyimpan data mentah ke ns.lastRawData
            const resultFromGAS = await ns.fetchChartData(ns.currentFilters); 

            // 2. Filter data mentah untuk mendapatkan data hari terakhir saja
            const dailyData = filterDataForLatestDay(ns.lastRawData);

            // 3. Terapkan sampling interval (range) HANYA pada data harian
            let processedData = dailyData;
            const range = ns.currentFilters.range;
            if (range !== 'all') {
                const interval = parseInt(range, 10);
                if (!isNaN(interval) && interval > 1 && dailyData.length > 0) {
                     // Filter dengan interval, pastikan indeks 0 selalu masuk
                    processedData = dailyData.filter((_, index) => index === 0 || index % interval === 0);
                }
            }
            
            // 4. Siapkan label dan render grafik
            const chartLabel = `${resultFromGAS.label} - ${ns.currentFilters.location} (Hari Terakhir)`;
            ns.renderChart(ns.dataChartCanvas, processedData, chartLabel);
            
            // 5. Reset zoom jika diminta (setelah rendering)
            if (isReset && ns._chart) {
                // Beri sedikit waktu agar chart selesai render sebelum reset zoom
                setTimeout(() => ns._chart?.resetZoom(), 100); 
            }

        } catch (err) {
            alert(err.message || 'Terjadi error saat memuat atau memproses data.');
            if (ns._chart) { ns._chart.destroy(); ns._chart = null; } // Bersihkan grafik jika error
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
                    
                    // Update teks trigger
                    trigger.textContent = this.querySelector('span') ? this.querySelector('span').textContent : this.textContent.trim();
                    optionsContainer.classList.remove('active'); // Tutup dropdown

                    // Update filter dan muat ulang data
                    const filterType = wrapper.id.replace('-filter', '');
                    const key = filterType === 'time-range' ? 'range' : filterType === 'data-type' ? 'dataType' : filterType;
                    ns.currentFilters[key] = this.getAttribute('data-value');
                    
                    console.log("Filters updated:", ns.currentFilters);
                    ns.loadChartData(); // Muat ulang data saat filter berubah
                });
            });
        });
        // Tutup dropdown jika klik di luar
        window.addEventListener('click', () => {
            document.querySelectorAll('.custom-options.active').forEach(el => el.classList.remove('active'));
        });
        
        // FUNGSIKAN TOMBOL ZOOM
        ns.zoomInBtn.addEventListener('click', () => ns._chart?.zoom(1.1));
        ns.zoomOutBtn.addEventListener('click', () => ns._chart?.zoom(0.9));
        // Tombol Reset sekarang memanggil loadChartData dengan flag isReset
        ns.zoomResetBtn.addEventListener('click', () => {
             console.log("Reset Zoom clicked");
             ns.loadChartData(true); // Muat ulang data (filter harian) DAN reset zoom
        });
    };

    ns.init = function(){
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            alert('Anda harus login terlebih dahulu!');
            window.location.href = 'index.html';
            return;
        }
        // Pastikan filter awal sesuai dengan HTML
        try {
            ns.currentFilters.location = ns.q('#location-filter .custom-option.active')?.getAttribute('data-value') || 'surabaya';
            ns.currentFilters.dataType = ns.q('#data-type-filter .custom-option.active')?.getAttribute('data-value') || 'Suhu Udara (°C)';
            ns.currentFilters.range = ns.q('#time-range-filter .custom-option.active')?.getAttribute('data-value') || '5';
            
            // Set teks trigger sesuai filter awal
            ns.q('#location-filter .custom-select-trigger').textContent = ns.q('#location-filter .custom-option.active span')?.textContent || 'Kota Surabaya';
            ns.q('#data-type-filter .custom-select-trigger').textContent = ns.q('#data-type-filter .custom-option.active span')?.textContent || 'Suhu Udara';
            ns.q('#time-range-filter .custom-select-trigger').textContent = ns.q('#time-range-filter .custom-option.active span')?.textContent || 'Per 5 Menit (Hari Terakhir)';

        } catch (e) {
            console.error("Gagal membaca filter awal dari HTML.", e);
        }
        
        ns.setupEventListeners();
        ns.loadChartData(); // Muat data awal (otomatis terfilter harian)
    };
})(window.ChartApp);
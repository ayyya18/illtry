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
        dataType: 'Suhu Udara (°C)', // Sesuaikan dengan nilai awal dropdown Anda
        range: '5'
    };

    ns.loadChartData = async function(){
        ns.showLoading(ns.loadingSpinner, ns.dataChartCanvas);
        try {
            // Pastikan filter dataType dikirim dengan benar ke fetchChartData
            const result = await ns.fetchChartData(ns.currentFilters);
            // Gunakan label dari respons Apps Script
            const chartLabel = `${result.label} - ${ns.currentFilters.location}`;
            ns.renderChart(ns.dataChartCanvas, result.data, chartLabel);
        } catch (err) {
            alert(err.message || 'Terjadi error saat memuat data.');
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
            
            // Event listener untuk membuka/menutup dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation(); // Hentikan event agar tidak langsung menutup
                const isActive = optionsContainer.classList.contains('active');
                // Tutup semua dropdown lain dulu
                document.querySelectorAll('.custom-options.active').forEach(el => {
                    if (el !== optionsContainer) el.classList.remove('active');
                });
                // Toggle dropdown yang diklik
                optionsContainer.classList.toggle('active');
            });

            // Event listener untuk memilih opsi
            optionsContainer.querySelectorAll('.custom-option').forEach(option => {
                option.addEventListener('click', function() {
                    // Update tampilan dropdown
                    this.parentElement.querySelector('.active')?.classList.remove('active');
                    this.classList.add('active');
                    trigger.textContent = this.textContent.trim(); // Ambil teks dari span
                    optionsContainer.classList.remove('active'); // Tutup dropdown

                    // Update filter dan muat ulang data
                    const filterType = wrapper.id.replace('-filter', ''); // 'location', 'data-type', 'time-range'
                    const key = filterType === 'time-range' ? 'range' : filterType === 'data-type' ? 'dataType' : filterType;
                    ns.currentFilters[key] = this.getAttribute('data-value');
                    
                    console.log("Filters updated:", ns.currentFilters); // Debugging
                    ns.loadChartData();
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
        ns.zoomResetBtn.addEventListener('click', () => ns._chart?.resetZoom());
    };

    ns.init = function(){
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            alert('Anda harus login terlebih dahulu!');
            window.location.href = 'index.html';
            return;
        }
        // Ambil nilai awal dari HTML untuk filter
        try {
            ns.currentFilters.location = ns.q('#location-filter .custom-option.active').getAttribute('data-value');
            ns.currentFilters.dataType = ns.q('#data-type-filter .custom-option.active').getAttribute('data-value');
            ns.currentFilters.range = ns.q('#time-range-filter .custom-option.active').getAttribute('data-value');
        } catch (e) {
            console.error("Gagal membaca filter awal dari HTML, menggunakan default.");
        }
        
        ns.setupEventListeners();
        ns.loadChartData(); // Muat data awal
    };
})(window.ChartApp);
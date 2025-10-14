window.ChartApp = window.ChartApp || {};
(function(ns){
    // DOM refs
    ns.loadingSpinner = ns.q('#loading-spinner');
    ns.dataChartCanvas = ns.q('#dataChart');
    // Tombol-tombol baru
    ns.zoomInBtn = ns.q('#zoom-in-btn');
    ns.zoomOutBtn = ns.q('#zoom-out-btn');
    ns.zoomResetBtn = ns.q('#zoom-reset-btn');

    ns.currentFilters = {
        location: 'surabaya',
        dataType: 'suhuUdara',
        range: '5'
    };

    ns.loadChartData = async function(){
        ns.showLoading(ns.loadingSpinner, ns.dataChartCanvas);
        try {
            const result = await ns.fetchChartData(ns.currentFilters);
            const label = `${result.label} - ${ns.currentFilters.location}`;
            ns.renderChart(ns.dataChartCanvas, result.data, label);
        } catch (err) {
            alert(err.message || 'Terjadi error saat memuat data.');
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
                document.querySelectorAll('.custom-options.active').forEach(el => el.classList.remove('active'));
                if (!isActive) optionsContainer.classList.add('active');
            });

            optionsContainer.querySelectorAll('.custom-option').forEach(option => {
                option.addEventListener('click', function() {
                    this.parentElement.querySelector('.active').classList.remove('active');
                    this.classList.add('active');
                    trigger.textContent = this.textContent.trim();
                    optionsContainer.classList.remove('active');

                    const filterType = wrapper.id.replace('-filter', '');
                    const key = filterType.replace('time-range', 'range').replace('data-type', 'dataType');
                    ns.currentFilters[key] = this.getAttribute('data-value');
                    ns.loadChartData();
                });
            });
        });
        window.addEventListener('click', () => document.querySelectorAll('.custom-options.active').forEach(el => el.classList.remove('active')));

        // 4. FUNGSIKAN TOMBOL ZOOM
        ns.zoomInBtn.addEventListener('click', () => {
            if (ns._chart) ns._chart.zoom(1.1); // Perbesar 10%
        });
        ns.zoomOutBtn.addEventListener('click', () => {
            if (ns._chart) ns._chart.zoom(0.9); // Perkecil 10%
        });
        ns.zoomResetBtn.addEventListener('click', () => {
            if (ns._chart) ns._chart.resetZoom(); // Kembali ke tampilan awal
        });
    };

    ns.init = function(){
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            alert('Anda harus login terlebih dahulu!');
            window.location.href = 'index.html';
            return;
        }
        ns.setupEventListeners();
        ns.loadChartData();
    };
})(window.ChartApp);
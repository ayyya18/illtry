window.ChartApp = window.ChartApp || {};
(function(ns){
    // DOM refs
    ns.locationFilter = ns.q('#location-filter');
    ns.dataTypeFilter = ns.q('#data-type-filter');
    ns.timeRangeFilter = ns.q('#time-range-filter');
    ns.dataChartCanvas = ns.q('#dataChart');
    ns.loadingSpinner = ns.q('#loading-spinner');

    ns.currentFilters = { location: 'surabaya', dataType: 'suhuUdara', range: '5' };
    ns.dropdownCloseTimer = null;

    ns.loadChartData = async function(){
        ns.showLoading(ns.loadingSpinner, ns.dataChartCanvas);
        try {
            const result = await ns.fetchChartData(ns.currentFilters);
            const locationTextEl = document.querySelector(`#location-filter .custom-option[data-value="${ns.currentFilters.location}"] span`);
            const locationText = locationTextEl ? locationTextEl.textContent : ns.currentFilters.location;
            const chartLabel = `${result.label} - ${locationText}`;
            ns.renderChart(ns.dataChartCanvas, result.data, chartLabel);
        } catch (err) {
            alert(err.message || 'Terjadi error saat menghubungi server grafik.');
        } finally {
            ns.hideLoading(ns.loadingSpinner, ns.dataChartCanvas);
        }
    };

    ns.setupDropdowns = function(){
        const allDropdowns = document.querySelectorAll('.custom-select-wrapper');
        const closeAllDropdowns = () => allDropdowns.forEach(wrapper => wrapper.querySelector('.custom-options').classList.remove('active'));

        allDropdowns.forEach(wrapper => {
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const optionsContainer = wrapper.querySelector('.custom-options');
            const options = wrapper.querySelectorAll('.custom-option');

            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const isActive = optionsContainer.classList.contains('active');
                closeAllDropdowns();
                if (!isActive) optionsContainer.classList.add('active');
            });

            options.forEach(option => option.addEventListener('click', function(){
                options.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                trigger.textContent = this.querySelector('span').textContent;
                closeAllDropdowns();
                const filterType = wrapper.id.replace('-filter','');
                ns.currentFilters[filterType.replace('time-range','range').replace('data-type','dataType')] = this.getAttribute('data-value');
                ns.loadChartData();
            }));

            wrapper.addEventListener('mouseenter', () => clearTimeout(ns.dropdownCloseTimer));
            wrapper.addEventListener('mouseleave', () => { ns.dropdownCloseTimer = setTimeout(closeAllDropdowns, 1500); });
        });

        window.addEventListener('click', closeAllDropdowns);
    };

    ns.init = function(){
        if (localStorage.getItem('isLoggedIn') !== 'true') { alert('Anda harus login terlebih dahulu!'); window.location.href = 'index.html'; return; }
        ns.setupDropdowns();
        ns.loadChartData();
    };
})(window.ChartApp);

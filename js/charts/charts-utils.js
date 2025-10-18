window.ChartApp = window.ChartApp || {};
(function(ns){
    ns.q = (sel, ctx=document) => ctx.querySelector(sel);
    ns.showLoading = (spinner, canvas) => { if (spinner) spinner.style.display = 'block'; if (canvas) canvas.style.opacity = '0.3'; };
    ns.hideLoading = (spinner, canvas) => { if (spinner) spinner.style.display = 'none'; if (canvas) canvas.style.opacity = '1'; };

    ns.lastRawData = null; // Tetap simpan data mentah
    ns.currentChartData = null; // Simpan data yang sedang ditampilkan

    ns.renderChart = function(canvas, chartData, label){
        if (!canvas) return;

        ns.currentChartData = chartData; // Simpan data yang dirender

        if (!chartData || chartData.length === 0) {
            if (ns._chart) { ns._chart.destroy(); ns._chart = null; }
            alert('Tidak ada data yang ditemukan untuk filter yang dipilih.');
            return;
        }

        const labels = chartData.map(item => Array.isArray(item.time) ? item.time[0] : item.time);
        const values = chartData.map(item => item.value);

        if (ns._chart) ns._chart.destroy();

        const ctx = canvas.getContext('2d');
        ns._chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: values,
                    borderColor: 'rgba(54,162,235,1)',
                    backgroundColor: 'rgba(54,162,235,0.2)',
                    borderWidth: 2,
                    pointRadius: 3,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#fff' } },
                    y: { ticks: { color: '#fff' } }
                },
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    zoom: {
                        // --- KONFIGURASI PANNING (GESER) ADA DI SINI ---
                        pan: {
                            enabled: true,  // <-- PASTIKAN INI TRUE
                            mode: 'x',      // <-- Geser hanya horizontal
                            threshold: 5,   // <-- Sensitivitas drag (opsional)
                        },
                        // --- Konfigurasi Zoom ---
                        zoom: {
                            wheel: { enabled: true },
                            pinch: { enabled: true },
                            mode: 'x',
                        }
                    }
                }
            }
        });
    };
})(window.ChartApp);
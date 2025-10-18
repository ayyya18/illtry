window.ChartApp = window.ChartApp || {};
(function(ns){
    ns.q = (sel, ctx=document) => ctx.querySelector(sel);
    ns.showLoading = (spinner, canvas) => { if (spinner) spinner.style.display = 'block'; if (canvas) canvas.style.opacity = '0.3'; };
    ns.hideLoading = (spinner, canvas) => { if (spinner) spinner.style.display = 'none'; if (canvas) canvas.style.opacity = '1'; };

    ns.renderChart = function(canvas, chartData, label){
        if (!canvas) return;
        if (!chartData || chartData.length === 0) {
            if (ns._chart) { ns._chart.destroy(); ns._chart = null; }
            alert('Tidak ada data yang ditemukan untuk filter yang dipilih.');
            return;
        }
        
        // Perbaikan: Pastikan label waktu konsisten (misal: 'HH:mm')
        // const labels = chartData.map(item => Array.isArray(item.time) ? item.time[0] : item.time); 
        const labels = chartData.map(item => item.time); // Gunakan format waktu dari GAS
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
                    pointRadius: 3, // Sedikit lebih besar agar terlihat saat zoom out
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
                // --- AKTIFKAN PLUGIN ZOOM & PAN DI SINI ---
                plugins: {
                    legend: { labels: { color: '#fff' } },
                    zoom: {
                        pan: {
                            enabled: true,      // Aktifkan mode geser (pan)
                            mode: 'x',          // Hanya geser secara horizontal
                        },
                        zoom: {
                            wheel: { enabled: true },  // Aktifkan zoom dengan roda mouse
                            pinch: { enabled: true },   // Aktifkan zoom dengan cubit (layar sentuh)
                            mode: 'x',          // Hanya zoom secara horizontal
                        }
                    }
                }
            }
        });
    };
})(window.ChartApp);
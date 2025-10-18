window.ChartApp = window.ChartApp || {};
(function(ns){
    ns.q = (sel, ctx=document) => ctx.querySelector(sel);
    ns.showLoading = (spinner, canvas) => { if (spinner) spinner.style.display = 'block'; if (canvas) canvas.style.opacity = '0.3'; };
    ns.hideLoading = (spinner, canvas) => { if (spinner) spinner.style.display = 'none'; if (canvas) canvas.style.opacity = '1'; };

    ns.renderChart = function(canvas, chartData, label){
        if (!canvas) return;

        // Kosongkan grafik jika tidak ada data
        if (!chartData || chartData.length === 0) {
            if (ns._chart) { ns._chart.destroy(); ns._chart = null; }
            // Tampilkan pesan di area canvas jika mau
            // const ctx = canvas.getContext('2d');
            // ctx.clearRect(0, 0, canvas.width, canvas.height);
            // ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            // ctx.textAlign = 'center';
            // ctx.fillText("Tidak ada data untuk ditampilkan.", canvas.width / 2, canvas.height / 2);
            alert('Tidak ada data yang ditemukan untuk filter yang dipilih.'); // Tetap pakai alert
            return;
        }
        
        // Asumsi format 'time' adalah array [HH:mm, dd MMM] dari GAS Anda
        const labels = chartData.map(item => Array.isArray(item.time) ? item.time[0] : item.time); // Ambil bagian HH:mm
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
                    zoom: { // <-- Konfigurasi Plugin
                        pan: {
                            enabled: true,
                            mode: 'x',
                            threshold: 5,
                        },
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
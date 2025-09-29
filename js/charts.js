// --- GANTI DENGAN URL WEB APP ANDA UNTUK MENGAMBIL DATA ---
const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbweNdoOrHEg_g_jedkIpgiQRbHqi6_iT9zgc8G93EJsn9KIwneh74zTCK0vIJbsk6sHQw/exec';
// ---------------------------------------------------------

// --- Elemen DOM ---
const locationFilter = document.getElementById('location-filter');
const dataTypeFilter = document.getElementById('data-type-filter');
const timeRangeFilter = document.getElementById('time-range-filter');
const dataChartCanvas = document.getElementById('dataChart');
const loadingSpinner = document.getElementById('loading-spinner');
let dataChart;

// --- Variabel State ---
let currentFilters = {
    location: 'surabaya',
    dataType: 'suhuUdara',
    range: '5'
};
let dropdownCloseTimer;

// --- Fungsi untuk Merender Grafik ---
function renderChart(chartData, label) {
    if (!chartData || chartData.length === 0) {
        if (dataChart) dataChart.destroy();
        alert("Tidak ada data yang ditemukan untuk filter yang dipilih.");
        return;
    }
    const labels = chartData.map(item => item.time);
    const values = chartData.map(item => item.value);
    if (dataChart) dataChart.destroy();
    const ctx = dataChartCanvas.getContext('2d');
    dataChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: label, data: values,
                borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)',
                borderWidth: 2, pointRadius: 3, pointBackgroundColor: 'rgba(54, 162, 235, 1)',
                tension: 0.3, fill: true
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { x: { ticks: { color: '#fff' } }, y: { ticks: { color: '#fff' } } },
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });
}

// --- Fungsi untuk Memuat Data dari Google Sheet ---
function loadChartData() {
    const { location, dataType, range } = currentFilters;
    const url = `${GOOGLE_SHEET_WEB_APP_URL}?range=${range}&dataType=${dataType}&location=${location}`;
    
    // Tampilkan animasi loading
    loadingSpinner.style.display = 'block';
    dataChartCanvas.style.opacity = '0.3';

    fetch(url)
        .then(response => response.json())
        .then(result => {
            if (result.status === 'success') {
                const locationText = document.querySelector(`#location-filter .custom-option[data-value="${location}"] span`).textContent;
                const chartLabel = `${result.label} - ${locationText}`;
                renderChart(result.data, chartLabel);
            } else {
                alert("Gagal memuat data grafik: " + result.message);
            }
        })
        .catch(error => alert("Terjadi error saat menghubungi server grafik."))
        .finally(() => {
            // Sembunyikan animasi loading
            loadingSpinner.style.display = 'none';
            dataChartCanvas.style.opacity = '1';
        });
}

// --- Event Listener & Inisialisasi ---
document.addEventListener('DOMContentLoaded', function() {
    if (localStorage.getItem("isLoggedIn") !== "true") {
        alert("Anda harus login terlebih dahulu!");
        window.location.href = 'index.html';
        return;
    }

    // --- Logika untuk Dropdown Kustom ---
    const allDropdowns = document.querySelectorAll('.custom-select-wrapper');
    const closeAllDropdowns = () => {
        allDropdowns.forEach(wrapper => wrapper.querySelector('.custom-options').classList.remove('active'));
    };

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

        options.forEach(option => {
            option.addEventListener('click', function() {
                options.forEach(opt => opt.classList.remove('active'));
                this.classList.add('active');
                trigger.textContent = this.querySelector('span').textContent;
                closeAllDropdowns();
                const filterType = wrapper.id.replace('-filter', '');
                currentFilters[filterType.replace('time-range', 'range').replace('data-type', 'dataType')] = this.getAttribute('data-value');
                loadChartData();
            });
        });

        // Fitur Auto-Close
        wrapper.addEventListener('mouseenter', () => clearTimeout(dropdownCloseTimer));
        wrapper.addEventListener('mouseleave', () => {
            dropdownCloseTimer = setTimeout(closeAllDropdowns, 1500); // Tutup setelah 1.5 detik
        });
    });

    window.addEventListener('click', closeAllDropdowns);

    // Muat data grafik awal saat halaman dibuka
    loadChartData();
});
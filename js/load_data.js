const GOOGLE_SHEET_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzvvIHcWmJROgMmlom6NI8aFW9UD4WuMr7ughgTiHx4H8R2s-O9XCUTfeYBxC4RFDOWWQ/exec';
// Konfigurasi Firebase Anda
const firebaseConfig = {
    apiKey: "AIzaSyBocEu3xpflgxTLfGu7KpqKl9CKq56nQTs",
    authDomain: "illtry-1b834.firebaseapp.com",
    databaseURL: "https://illtry-1b834-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "illtry-1b834",
    storageBucket: "illtry-1b834.firebasestorage.app",
    messagingSenderId: "392211014938",
    appId: "1:392211014938:web:17e5f6ae3db13ccdd638a3",
    measurementId: "G-2SWV2QKWN5"
};
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database(app);
const openWeatherApiKey = '5713af0c029a6607c56bd11eea2ab6d6';

let sensorRef, weatherref, notificationsRef, weatherUpdateInterval;
let __lastDebugError = null;
function checkSoilAcidity(snapshot) {
    const data = snapshot.val();
    if (!data || data.ph === undefined || !notificationsRef || !sensorRef) return;
    const phValue = parseFloat(data.ph);
    const lastNotifiedStatus = data.ph_status || 'netral';
    let currentStatus = 'netral';
    let notificationText = null;
    if (phValue < 6.5) {
        currentStatus = 'asam';
        notificationText = "Tanah terlalu masam, segera lakukan tindakan untuk mengembalikan kondisi tanah menjadi netral";
    } else if (phValue > 7.5) {
        currentStatus = 'basa';
        notificationText = "Tanah terlalu basa, segera lakukan tindakan untuk mengembalikan kondisi tanah menjadi netral";
    }
    if (currentStatus !== lastNotifiedStatus) {
        if (currentStatus !== 'netral') {
            notificationsRef.push({
                text: notificationText,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                read: false,
            });
        }
        sensorRef.update({ ph_status: currentStatus });
    }
}

function tampilkanData(snapshot) {
    const data = snapshot.val();
    const el = (id, value) => { const e = document.getElementById(id); if (e) e.textContent = value; };
    if (data) {
        el('temperature', data.temperature ?? "N/A");
        el('humidity', data.humidity ?? "N/A");
        el('ph', data.ph ?? "N/A");
        el('lightIntensity', data.lightIntensity ?? "N/A");
        el('waterlevel', data.waterlevel ?? "N/A");
        el('tds', data.tds ?? "N/A");
        el('waterTemp', data.waterTemp ?? "N/A");
        el('waterPh', data.waterPh ?? "N/A");
        el('dissolvedO2', data.dissolvedO2 ?? "N/A");
        el('salinity', data.salinity ?? "N/A");
    } else {
        ["temperature", "humidity", "ph", "lightIntensity", "waterlevel", "tds", "waterTemp", "waterPh", "dissolvedO2", "salinity"].forEach(id => el(id, "Data Kosong"));
    }
}

function tampilkanCuaca(snapshot) {
    const data = snapshot.val();
    const el = (id, value) => { const e = document.getElementById(id); if (e) e.textContent = value; };
    if (data) {
        el('suhu', data.suhu ?? "N/A");
        el('kecepatanAngin', data.kecepatanAngin ?? "N/A");
        el('deskripsi', data.deskripsi || "N/A");
        el('hujan', data.hujan ?? "0");
        el('kelembaban', data.kelembaban ?? "N/A");
    } else {
        ["suhu", "kecepatanAngin", "deskripsi", "hujan", "kelembaban"].forEach(id => el(id, "Data Kosong"));
    }
}

function displayNotifications(snapshot) {
    const dropdownMenu = document.querySelector('.user-menu .dropdown-menu');
    if (!dropdownMenu) return;
    const footer = dropdownMenu.querySelector('.dropdown-footer');
    const badge = document.querySelector('.notification-badge');
    dropdownMenu.querySelectorAll('.notification-item, .no-notification-message').forEach(el => el.remove());
    const notifications = snapshot.val();
    let count = 0;
    if (notifications) {
        const keys = Object.keys(notifications).reverse();
        count = keys.length;
        keys.forEach(key => {
            const notification = notifications[key];
            const item = document.createElement('a');
            item.href = "#";
            item.className = 'notification-item';
            item.innerHTML = `<span class="notification-text">${notification.text}</span><span class="notification-time">${new Date(notification.timestamp).toLocaleString('id-ID')}</span>`;
            dropdownMenu.insertBefore(item, footer);
        });
    }
    if (count === 0) {
        const noMsg = document.createElement('div');
        noMsg.className = 'no-notification-message';
        noMsg.textContent = 'Tidak ada notifikasi baru';
        noMsg.style.cssText = 'text-align: center; padding: 20px; font-size: 0.45em; opacity: 0.7;';
        dropdownMenu.insertBefore(noMsg, footer);
        badge.style.display = 'none';
    } else {
        badge.textContent = count;
        badge.style.display = 'flex';
    }
}

function updateWeatherFromAPI(city) {
    if (!city) return;
    const weatherDataRefForAPI = database.ref(`/lokasi/${city}/cuaca`);
    weatherDataRefForAPI.once('value', (snapshot) => {
        const cachedData = snapshot.val();
        if (cachedData && cachedData.timestamp && (Date.now() - cachedData.timestamp) < 900000) return;
        fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openWeatherApiKey}&units=metric&lang=id`)
            .then(res => res.json())
            .then(data => {
                if (data.cod !== 200) throw new Error(data.message);
                const weatherData = {
                    suhu: Math.round(data.main.temp),
                    kecepatanAngin: data.wind.speed,
                    deskripsi: data.weather[0].description,
                    kelembaban: data.main.humidity,
                    hujan: data.rain?.['1h'] ?? 0,
                    timestamp: Date.now()
                };
                weatherDataRefForAPI.set(weatherData);
            }).catch(err => console.error(`Gagal update cuaca untuk ${city}:`, err));
    });
}

function loadDataForLocation(locationName) {
    if (!locationName) return;
    if (sensorRef) sensorRef.off();
    if (weatherref) weatherref.off();
    if (notificationsRef) notificationsRef.off();
    if (weatherUpdateInterval) clearInterval(weatherUpdateInterval);
    const basePath = `/lokasi/${locationName}`;
    sensorRef = database.ref(`${basePath}/sensor`);
    weatherref = database.ref(`${basePath}/cuaca`);
    notificationsRef = database.ref(`${basePath}/notifications`);
    sensorRef.on('value', tampilkanData);
    weatherref.on('value', tampilkanCuaca);
    notificationsRef.on('value', displayNotifications);
    sensorRef.on('value', checkSoilAcidity);
    updateWeatherFromAPI(locationName);
    weatherUpdateInterval = setInterval(() => updateWeatherFromAPI(locationName), 900000);
}

function exportNotificationsToExcel() {
    if (!notificationsRef) { alert("Pilih lokasi terlebih dahulu."); return; }
    notificationsRef.once('value', (snapshot) => {
        const notifications = snapshot.val();
        if (!notifications) { alert("Tidak ada notifikasi untuk diekspor."); return; }
        const dataForExcel = Object.values(notifications).map(n => ({
            'Waktu': new Date(n.timestamp).toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'medium' }),
            'Pesan Notifikasi': n.text
        })).reverse();
        const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
        worksheet['!cols'] = [{ wch: 30 }, { wch: 80 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat Notifikasi");
        XLSX.writeFile(workbook, `Riwayat_Notifikasi_${localStorage.getItem('currentLocation') || 'dashboard'}.xlsx`);
    }).catch(error => console.error("Gagal mengekspor:", error));
}

function toggleCategoryView(category) {
    try {
        const mikroKlimatCards = document.querySelectorAll('.mikro-klimat-card');
        const kualitasAirCards = document.querySelectorAll('.kualitas-air-card');
        if (category === 'mikro-klimat') {
            mikroKlimatCards.forEach(card => card.classList.remove('hidden'));
            kualitasAirCards.forEach(card => card.classList.add('hidden'));
        } else if (category === 'kualitas-air') {
            mikroKlimatCards.forEach(card => card.classList.add('hidden'));
            kualitasAirCards.forEach(card => card.classList.remove('hidden'));
        } else {
            console.warn('toggleCategoryView: unknown category', category);
        }
    } catch (err) {
        console.error('toggleCategoryView error for category', category, err);
    }
}


// --- EVENT LISTENER UTAMA SETELAH HALAMAN SIAP ---
document.addEventListener('DOMContentLoaded', function() {
    
    // Variabel untuk timer auto-close dropdown
    let dropdownCloseTimer;

    // --- Definisi Elemen ---
    const profileBtn = document.getElementById('profile-btn');
    const sideMenu = document.getElementById('side-menu');
    const closeBtn = document.getElementById('close-btn');
    const overlay = document.getElementById('overlay');
    const userMenu = document.querySelector('.user-menu');
    const allDropdownContainers = document.querySelectorAll('.user-menu, .custom-select-wrapper');

    // Sinkronisasi state dropdown dengan localStorage
    function syncDropdownState() {
        // Lokasi
    const storedLoc = localStorage.getItem('lastLocation') || localStorage.getItem('currentLocation');
        if (storedLoc) {
            const locationTrigger = document.getElementById('customSelectTrigger');
            const locationOptions = document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) .custom-option');
            locationOptions.forEach(o => o.classList.remove('active', 'bolded'));
            const matched = Array.from(locationOptions).find(o => o.dataset.value === storedLoc);
            if (matched) {
                matched.classList.add('active', 'bolded');
                if (locationTrigger) {
                    locationTrigger.textContent = matched.textContent.trim();
                }
            }
        }

        // Kategori
        const storedCat = localStorage.getItem('lastCategory');
        if (storedCat) {
            const categoryTrigger = document.getElementById('categorySelectTrigger');
            const categoryOptions = document.querySelectorAll('#category-options .custom-option');
            categoryOptions.forEach(o => o.classList.remove('active', 'bolded'));
            const matchedCat = Array.from(categoryOptions).find(o => o.dataset.value === storedCat);
            if (matchedCat) {
                matchedCat.classList.add('active', 'bolded');
                if (categoryTrigger) {
                    categoryTrigger.textContent = matchedCat.textContent.trim();
                }
            }
        }
    }

    const lastLocation = localStorage.getItem('lastLocation');
    if (lastLocation) {
        const locationTrigger = document.getElementById('customSelectTrigger');
        const locationOptions = document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) .custom-option');
        locationOptions.forEach(opt => {
            if (opt.dataset.value === lastLocation) {
                locationTrigger.textContent = opt.textContent.trim();
                locationOptions.forEach(o => o.classList.remove('active', 'bolded'));
                opt.classList.add('active', 'bolded');
            }
        });
        const locationDropdown = document.getElementById('locationDropdown');
        if (locationDropdown) locationDropdown.value = lastLocation;
    }

    const lastCategory = localStorage.getItem('lastCategory');
    if (lastCategory) {
        const categoryTrigger = document.getElementById('categorySelectTrigger');
        const categoryOptions = document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) #category-options .custom-option');
        categoryOptions.forEach(opt => {
            if (opt.dataset.value === lastCategory) {
                categoryTrigger.textContent = opt.textContent.trim();
                categoryOptions.forEach(o => o.classList.remove('active', 'bolded'));
                opt.classList.add('active', 'bolded');
            }
        });
    }

    // --- No debug overlay in production; errors still logged to console ---

    function closeAllDropdowns() {
        document.querySelectorAll('.custom-options.active, .dropdown-menu.active').forEach(el => {
            el.classList.remove('active');
        });
    }

    function toggleDropdown(targetMenu) {
        const isActive = targetMenu.classList.contains('active');
        closeAllDropdowns();
        if (!isActive) {
            syncDropdownState();
            targetMenu.classList.add('active');
        }
    }

    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sideMenu.classList.add('active');
        overlay.classList.add('active');
    });

    const closeSideMenu = () => {
        sideMenu.classList.remove('active');
        overlay.classList.remove('active');
    };
    closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeSideMenu(); });
    overlay.addEventListener('click', closeSideMenu);
    
    userMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const dropdownMenu = userMenu.querySelector('.dropdown-menu');
        toggleDropdown(dropdownMenu);
    });

    document.querySelectorAll('.custom-select-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const optionsMenu = e.currentTarget.closest('.custom-select-wrapper').querySelector('.custom-options');
            toggleDropdown(optionsMenu);
        });
    });

    document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) .custom-option').forEach(opt => {
    if (opt.__hasLocationHandler) return;
    opt.__hasLocationHandler = true;
        opt.addEventListener('click', function() {
            const value = this.dataset.value;
            localStorage.setItem('lastLocation', value);
            localStorage.setItem('currentLocation', value);
            document.getElementById('customSelectTrigger').textContent = this.textContent.trim();
            document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) .custom-option').forEach(o => o.classList.remove('active', 'bolded'));
            this.classList.add('active', 'bolded');
            const locationDropdown = document.getElementById('locationDropdown');
            if (locationDropdown) locationDropdown.value = value;
            loadDataForLocation(value);
        });
    });
    document.querySelectorAll('#category-options .custom-option').forEach(opt => {
    if (opt.__hasCategoryHandler) return;
    opt.__hasCategoryHandler = true;
        opt.addEventListener('click', function() {
            try {
                const value = this.dataset.value;
                localStorage.setItem('lastCategory', value);
                const catTrigger = document.getElementById('categorySelectTrigger');
                if (catTrigger) {
                    catTrigger.textContent = this.textContent.trim();
                }
                document.querySelectorAll('#category-options .custom-option').forEach(o => o.classList.remove('active', 'bolded'));
                this.classList.add('active', 'bolded');
                toggleCategoryView(value);
            } catch (err) {
                console.error('Error selecting category option', err, this);
                alert('Terjadi kesalahan saat memilih kategori. Periksa console untuk detail.');
            }
        });
    });
    window.addEventListener('click', () => {
        closeAllDropdowns();
    });
    allDropdownContainers.forEach(container => {
        container.addEventListener('mouseenter', () => {
            clearTimeout(dropdownCloseTimer);
        });
        container.addEventListener('mouseleave', () => {
            dropdownCloseTimer = setTimeout(() => {
                closeAllDropdowns();
            }, 1500);
        });
    });
    const storedUsername = localStorage.getItem('username');
    const storedEmail = localStorage.getItem('email');
    const userRole = localStorage.getItem('role');
    const adminMenuItem = document.getElementById('admin-menu-item');

    if (userRole === 'admin' && adminMenuItem) {
        adminMenuItem.style.display = 'block';
    }
    if (storedUsername && storedEmail) {
        const sideMenuUsername = document.querySelector('#side-menu .username');
        const sideMenuEmail = document.querySelector('#side-menu .email');
        if (sideMenuUsername) sideMenuUsername.textContent = storedUsername;
        if (sideMenuEmail) sideMenuEmail.textContent = storedEmail;
    }

    if (localStorage.getItem("isLoggedIn") !== "true") {
        alert("Anda harus login terlebih dahulu!");
        window.location.href = "index.html";
        return;
    }
    
    let currentCity = localStorage.getItem('currentLocation') || 'surabaya';
    document.querySelector('#customSelectTrigger').textContent = `Kota ${currentCity.charAt(0).toUpperCase() + currentCity.slice(1)}`;

    syncDropdownState();
    loadDataForLocation(currentCity);
    const initCategory = localStorage.getItem('lastCategory') || 'mikro-klimat';
    toggleCategoryView(initCategory);

    const updateDateTime = () => {
        const now = new Date();
        document.getElementById('time').textContent = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
        document.getElementById('date').textContent = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    };
    setInterval(updateDateTime, 1000);
    updateDateTime();
    
    document.getElementById('logoutButton').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin untuk keluar?")) {
            localStorage.clear();
            window.location.href = "index.html";
        }
    });

    document.getElementById('refreshButton').addEventListener('click', (e) => {
        e.preventDefault();
        loadDataForLocation(currentCity);
    });

    document.getElementById('clear-notifications-btn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm("Apakah Anda yakin ingin menghapus semua notifikasi?")) {
            if (notificationsRef) notificationsRef.remove();
        }
    });

    document.getElementById('send-report-make-btn').addEventListener('click', (e) => {
        e.preventDefault();
        fetch("https://hook.eu2.make.com/elfc4qhgf5v5cuqvf609xv1oelma1u4m", { method: 'POST' })
            .then(() => alert('Laporan terkirim!'));
    });

    document.getElementById('export-excel-btn').addEventListener('click', (e) => {
        e.preventDefault();
        exportNotificationsToExcel();
    });

    // --- Temperature slider initialization ---
    function initTempSlider() {
        const slider = document.querySelector('.temp-slider');
        if (!slider) return;
        const slidesWrap = slider.querySelector('.slides');
        const slides = slider.querySelectorAll('.slide');
        const prevBtn = slider.querySelector('.slider-btn.prev');
        const nextBtn = slider.querySelector('.slider-btn.next');
        const dotsWrap = slider.querySelector('.slider-dots');
        let index = 0;

        function renderDots() {
            if (!dotsWrap) return;
            dotsWrap.innerHTML = '';
            slides.forEach((s, i) => {
                const b = document.createElement('button');
                if (i === index) b.classList.add('active');
                b.addEventListener('click', () => goTo(i));
                dotsWrap.appendChild(b);
            });
        }

        function goTo(i) {
            index = (i + slides.length) % slides.length;
            if (slidesWrap) slidesWrap.style.transform = `translateX(-${index * 100}%)`;
            if (dotsWrap) Array.from(dotsWrap.children).forEach((d, di) => d.classList.toggle('active', di === index));
        }

        if (prevBtn) prevBtn.addEventListener('click', () => goTo(index - 1));
        if (nextBtn) nextBtn.addEventListener('click', () => goTo(index + 1));

        // keyboard support (left/right)
        window.addEventListener('keydown', (ev) => {
            if (ev.key === 'ArrowLeft') goTo(index - 1);
            if (ev.key === 'ArrowRight') goTo(index + 1);
        });

        // basic swipe support + desktop pointer drag
        let startX = null;
        if (slidesWrap) {
            slidesWrap.addEventListener('touchstart', (ev) => { startX = ev.touches[0].clientX; });
            slidesWrap.addEventListener('touchend', (ev) => {
                if (startX === null) return;
                const dx = ev.changedTouches[0].clientX - startX;
                if (Math.abs(dx) > 40) {
                    if (dx < 0) goTo(index + 1); else goTo(index - 1);
                }
                startX = null;
            });
            let isDown = false;
            let downX = 0;
            slidesWrap.addEventListener('pointerdown', (ev) => { isDown = true; downX = ev.clientX; slidesWrap.setPointerCapture(ev.pointerId); });
            slidesWrap.addEventListener('pointerup', (ev) => {
                if (!isDown) return; isDown = false; slidesWrap.releasePointerCapture(ev.pointerId);
                const dx = ev.clientX - downX;
                if (Math.abs(dx) > 60) {
                    if (dx < 0) goTo(index + 1); else goTo(index - 1);
                }
            });
            slidesWrap.addEventListener('pointercancel', () => { isDown = false; });
        }

        renderDots();
        goTo(0);
    }
    function updateSlidesFromData(data) {
        try {
            const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
            setText('slide-humidity', data.humidity ?? 'N/A');
            setText('slide-wind', (data.wind || data.kecepatanAngin || 0));
            setText('slide-rain', (data.rain || data.hujan || 0));
        } catch (err) {
            console.error('updateSlidesFromData error', err);
        }
    }
    const _tampilkanData = tampilkanData;
    tampilkanData = function(snapshot) {
        _tampilkanData(snapshot);
        try {
            const data = snapshot.val() || {};
            updateSlidesFromData(data);
        } catch (err) {
            console.error('tampilkanData wrapper error', err);
        }
    };
    if (typeof tampilkanCuaca === 'function') {
        const _tampilkanCuaca = tampilkanCuaca;
        tampilkanCuaca = function(snapshot) {
            _tampilkanCuaca(snapshot);
            try {
                const data = snapshot.val() || {};
                updateSlidesFromData(data);
            } catch (err) {
                console.error('tampilkanCuaca wrapper error', err);
            }
        };
    }
    let currentSlide = 0; 
    const slidesContainer = document.querySelector('.slides'); 
    const totalSlides = document.querySelectorAll('.slide').length; 
    const dotsContainer = document.querySelector('.slider-dots'); 
    const prevButton = document.querySelector('.slider-btn.prev'); 
    const nextButton = document.querySelector('.slider-btn.next'); 
    function updateSlider() {
        slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
        const dots = dotsContainer.querySelectorAll('button');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
        if (currentSlide === 0) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'flex';
        } else if (currentSlide === totalSlides - 1) {
            prevButton.style.display = 'flex';
            nextButton.style.display = 'none';
        } else {
            prevButton.style.display = 'flex';
            nextButton.style.display = 'flex';
        }
    }
     
    function goToSlide(slideIndex) {
        currentSlide = slideIndex;
        updateSlider();
    }
    function initializeSlider() {
        for (let i = 0; i < totalSlides; i++) {
            const dot = document.createElement('button');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
        updateSlider(); 
    }
    nextButton.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % totalSlides;
        updateSlider();
    });
    prevButton.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
        updateSlider();
    });
    initializeSlider();
    initTempSlider();
});


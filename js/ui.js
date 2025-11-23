// UI layer: DOM manipulation, dropdowns, menu, and connecting data layer
(function () {
    const App = window.App = window.App || {};

    function toggleCategoryView(category) {
        try {
            // Ambil semua kartu
            const allCards = document.querySelectorAll('.mikro-klimat-card, .kualitas-air-card');
            
            // Paksa semua kartu untuk tampil (hapus class 'hidden' jika ada)
            allCards.forEach(card => {
                card.classList.remove('hidden');
            });
            
            console.log('Menampilkan semua kategori sensor.');
        } catch (err) {
            console.error('Error in toggleCategoryView', err);
        }
    }

    function syncDropdownState() {
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

    function wireUI() {
        // Menu and overlay
        const profileBtn = document.getElementById('profile-btn');
        const sideMenu = document.getElementById('side-menu');
        const closeBtn = document.getElementById('close-btn');
        const overlay = document.getElementById('overlay');
        const userMenu = document.querySelector('.user-menu');
        const allDropdownContainers = document.querySelectorAll('.user-menu, .custom-select-wrapper');

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
        const closeSideMenu = () => { sideMenu.classList.remove('active'); overlay.classList.remove('active'); };
        closeBtn.addEventListener('click', (e) => { e.preventDefault(); closeSideMenu(); });
        overlay.addEventListener('click', closeSideMenu);

        userMenu.addEventListener('click', (e) => { e.stopPropagation(); const dropdownMenu = userMenu.querySelector('.dropdown-menu'); toggleDropdown(dropdownMenu); });

        document.querySelectorAll('.custom-select-trigger').forEach(trigger => {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const optionsMenu = e.currentTarget.closest('.custom-select-wrapper').querySelector('.custom-options');
                toggleDropdown(optionsMenu);
            });
        });

        document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) .custom-option').forEach(opt => {
            if (opt.__hasLocationHandler) return; opt.__hasLocationHandler = true;
            opt.addEventListener('click', function() {
                const value = this.dataset.value;
                localStorage.setItem('lastLocation', value);
                localStorage.setItem('currentLocation', value);
                document.getElementById('customSelectTrigger').textContent = this.textContent.trim();
                document.querySelectorAll('.custom-select-wrapper:not(#category-selector-wrapper) .custom-option').forEach(o => o.classList.remove('active', 'bolded'));
                this.classList.add('active', 'bolded');
                const locationDropdown = document.getElementById('locationDropdown');
                if (locationDropdown) locationDropdown.value = value;
                App.data && App.data.loadDataForLocation && App.data.loadDataForLocation(value);
            });
        });

        document.querySelectorAll('#category-options .custom-option').forEach(opt => {
            if (opt.__hasCategoryHandler) return; opt.__hasCategoryHandler = true;
            opt.addEventListener('click', function() {
                try {
                    const value = this.dataset.value;
                    localStorage.setItem('lastCategory', value);
                    const catTrigger = document.getElementById('categorySelectTrigger');
                    if (catTrigger) { catTrigger.textContent = this.textContent.trim(); }
                    document.querySelectorAll('#category-options .custom-option').forEach(o => o.classList.remove('active', 'bolded'));
                    this.classList.add('active', 'bolded');
                    toggleCategoryView(value);
                } catch (err) {
                    console.error('Error selecting category option', err, this);
                    alert('Terjadi kesalahan saat memilih kategori. Periksa console untuk detail.');
                }
            });
        });

        window.addEventListener('click', () => { closeAllDropdowns(); });
        allDropdownContainers.forEach(container => {
            let dropdownCloseTimer;
            container.addEventListener('mouseenter', () => { clearTimeout(dropdownCloseTimer); });
            container.addEventListener('mouseleave', () => {
                dropdownCloseTimer = setTimeout(() => { closeAllDropdowns(); }, 1500);
            });
        });

        // --- PERUBAHAN LOGIKA PROFIL & AUTENTIKASI ---
        const storedUsername = localStorage.getItem('username');
        const storedEmail = localStorage.getItem('email');
        const storedProfileImage = localStorage.getItem('profileImageUrl');
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

        // Logika baru untuk menampilkan foto profil atau ikon default
        const profileAvatar = document.getElementById('profile-avatar');
        const defaultAvatar = document.getElementById('default-avatar');
        
        // Cek apakah URL gambar ada dan bukan string kosong
        if (storedProfileImage && storedProfileImage.trim() !== '') {
            profileAvatar.src = storedProfileImage;
            profileAvatar.style.display = 'block';
            defaultAvatar.style.display = 'none';

            // Fungsi fallback jika gambar gagal dimuat (misal, URL rusak)
            profileAvatar.onerror = function() {
                profileAvatar.style.display = 'none';
                defaultAvatar.style.display = 'block';
            };
        } else {
            // Jika tidak ada URL, pastikan ikon default yang tampil
            profileAvatar.style.display = 'none';
            defaultAvatar.style.display = 'block';
        }
        // --- AKHIR PERUBAHAN ---

        if (localStorage.getItem("isLoggedIn") !== "true") {
            alert("Anda harus login terlebih dahulu!");
            window.location.href = "index.html";
            return;
        }

        let currentCity = localStorage.getItem('currentLocation') || 'surabaya';
        const customTrigger = document.querySelector('#customSelectTrigger');
        if (customTrigger) customTrigger.textContent = `Kota ${currentCity.charAt(0).toUpperCase() + currentCity.slice(1)}`;
        syncDropdownState();
        App.data && App.data.loadDataForLocation && App.data.loadDataForLocation(currentCity);
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

        const refreshButton = document.getElementById('refreshButton');
        refreshButton.addEventListener('click', (e) => { e.preventDefault(); App.data && App.data.loadDataForLocation && App.data.loadDataForLocation(localStorage.getItem('currentLocation') || 'surabaya'); });

        const clearNotif = document.getElementById('clear-notifications-btn');
        clearNotif.addEventListener('click', (e) => { e.preventDefault(); App.data && App.data.clearNotifications && App.data.clearNotifications(); });

        const sendReport = document.getElementById('send-report-make-btn');
        sendReport.addEventListener('click', (e) => { e.preventDefault(); fetch("https://hook.eu2.make.com/elfc4qhgf5v5cuqvf609xv1oelma1u4m", { method: 'POST' }).then(() => alert('Laporan terkirim!')); });

        const exportExcelBtn = document.getElementById('export-excel-btn');
        exportExcelBtn.addEventListener('click', (e) => { e.preventDefault(); App.data && App.data.exportNotificationsToExcel && App.data.exportNotificationsToExcel(); });
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

    App.ui = {
        wireUI,
        syncDropdownState,
        toggleCategoryView,
        updateSlidesFromData
    };
})();
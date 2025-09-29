window.AdminApp = window.AdminApp || {};
(function(ns){
    // Cache DOM
    ns.userTableBody = ns.q('#user-table-body');
    ns.addUserBtn = ns.q('#add-user-btn');
    ns.modal = ns.q('#user-modal');
    ns.closeModalBtn = ns.q('#close-modal-btn');
    ns.userForm = ns.q('#user-form');
    ns.modalTitle = ns.q('#modal-title');
    ns.userKeyInput = ns.q('#user-key');
    ns.usernameInput = ns.q('#username');
    ns.emailInput = ns.q('#email');
    ns.phoneInput = ns.q('#phone');
    ns.passwordInput = ns.q('#password');

    ns.openModal = () => { if (ns.modal) ns.modal.style.display = 'block'; };
    ns.closeModal = () => { if (ns.modal) ns.modal.style.display = 'none'; };

    ns.renderUsers = function(querySnapshot){
        if (!ns.userTableBody) return;
        ns.userTableBody.innerHTML = '';
        if (querySnapshot.empty) {
            ns.userTableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Tidak ada data pengguna.</td></tr>`;
            return;
        }
        querySnapshot.forEach(doc => {
            const userKey = doc.id;
            const userData = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${userData.username}</td>
                <td>${userData.email}</td>
                <td>${userData.phone || 'N/A'}</td>
                <td>${userData.role || 'user'}</td>
                <td class="actions">
                    <button class="action-btn edit-btn" data-key="${userKey}"><i class="fas fa-edit"></i> Edit</button>
                    <button class="action-btn delete-btn" data-key="${userKey}"><i class="fas fa-trash"></i> Hapus</button>
                </td>
            `;
            ns.userTableBody.appendChild(tr);
        });
    };

    ns.wireEvents = function(){
        if (ns.addUserBtn) ns.addUserBtn.addEventListener('click', ()=>{
            ns.modalTitle.textContent = 'Tambah Pengguna Baru';
            ns.userForm.reset(); ns.userKeyInput.value = ''; ns.passwordInput.required = true; ns.openModal();
        });

        if (ns.userTableBody) ns.userTableBody.addEventListener('click', async e => {
            const editBtn = e.target.closest('.edit-btn');
            const delBtn = e.target.closest('.delete-btn');
            if (editBtn) {
                const key = editBtn.dataset.key;
                try {
                    const data = await ns.getUser(key);
                    if (data) {
                        ns.modalTitle.textContent = 'Edit Pengguna';
                        ns.userKeyInput.value = key;
                        ns.usernameInput.value = data.username || '';
                        ns.emailInput.value = data.email || '';
                        ns.phoneInput.value = data.phone || '';
                        ns.passwordInput.required = false;
                        ns.openModal();
                    }
                } catch (err) { alert('Gagal mengambil data: ' + err.message); }
            } else if (delBtn) {
                const key = delBtn.dataset.key;
                if (confirm('Apakah Anda yakin ingin menghapus pengguna ini?')) {
                    try { await ns.deleteUser(key); alert('Pengguna berhasil dihapus.'); } catch (err) { alert('Gagal menghapus pengguna: ' + err.message); }
                }
            }
        });

        if (ns.userForm) ns.userForm.addEventListener('submit', async e => {
            e.preventDefault();
            const key = ns.userKeyInput.value;
            const username = ns.usernameInput.value.trim();
            const email = ns.emailInput.value.trim();
            const phone = ns.phoneInput.value.trim();
            const password = ns.passwordInput.value;
            const userData = { username, email, phone, role: 'user' };
            try {
                if (key) {
                    if (password) {
                        if (password.length < 8) { alert('Password minimal 8 karakter.'); return; }
                        const userDoc = await ns.getUser(key);
                        const salt = userDoc.salt;
                        userData.hashedPassword = await ns.hashPassword(password, salt);
                    }
                    await ns.updateUser(key, userData);
                    ns.closeModal(); alert('Data berhasil diperbarui.');
                } else {
                    if (!password || password.length < 8) { alert('Password wajib diisi (minimal 8 karakter).'); return; }
                    const salt = crypto.randomUUID();
                    userData.salt = salt;
                    userData.hashedPassword = await ns.hashPassword(password, salt);
                    await ns.addUser(userData);
                    ns.closeModal(); alert('Pengguna baru berhasil ditambahkan.');
                }
            } catch (err) { alert('Gagal menyimpan data: ' + err.message); }
        });

        if (ns.closeModalBtn) ns.closeModalBtn.addEventListener('click', ns.closeModal);
        window.addEventListener('click', e => { if (e.target === ns.modal) ns.closeModal(); });
    };

    ns.init = function(){
        // Access control
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const userRole = localStorage.getItem('role');
        if (isLoggedIn !== 'true' || userRole !== 'admin') { alert('Akses ditolak! Anda harus login sebagai admin.'); window.location.href = 'index.html'; return; }

        ns.wireEvents();
        // Start streaming users
        try {
            ns.streamUsers(ns.renderUsers, (error) => { console.error('Gagal memuat data pengguna.', error); alert('Gagal memuat data pengguna. Lihat console untuk detail.'); });
        } catch (err) { console.error('Stream users failed:', err); alert('Gagal memuat data pengguna.'); }
    };
})(window.AdminApp);

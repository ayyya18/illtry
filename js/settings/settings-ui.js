window.SettingsApp = window.SettingsApp || {};
(function(ns){
    // DOM refs
    ns.settingsForm = ns.q('#settings-form');
    ns.userDataGroup = ns.q('#user-data-group');
    ns.otpGroup = ns.q('#otp-group');
    ns.userKeyInput = ns.q('#user-key');
    ns.usernameInput = ns.q('#username');
    ns.emailInput = ns.q('#email');
    ns.phoneInput = ns.q('#phone');
    ns.passwordInput = ns.q('#password');
    ns.otpInput = ns.q('#otp');
    ns.otpEmailInfo = ns.q('#otp-email-info');
    ns.submitBtn = ns.q('#submit-btn');
    ns.errorMessage = ns.q('#error-message');
    ns.profileImageInput = ns.q('#profileImageInput');
    ns.profilePreview = ns.q('#profile-preview');
    ns.avatarPlaceholder = ns.q('#avatar-placeholder');

    // State
    ns.stage = 'data';
    ns.initialUserData = {};
    ns.currentUserSalt = null;
    ns.changesToSubmit = {};
    ns.newProfileImageFile = null;

    ns.populateUserData = async function(){
        const storedUsername = localStorage.getItem('username');
        if (!storedUsername) {
            alert('Sesi tidak ditemukan, silakan login kembali.');
            window.location.href = 'index.html';
            return false;
        }
        try {
            const res = await ns.getUserByUsername(storedUsername);
            if (!res) {
                alert('Gagal memuat data pengguna dari server.');
                return false;
            }
            ns.initialUserData = res.data;
            ns.userKeyInput.value = res.key;
            ns.currentUserSalt = ns.initialUserData.salt;
            ns.usernameInput.value = ns.initialUserData.username;
            ns.emailInput.value = ns.initialUserData.email;
            ns.phoneInput.value = ns.initialUserData.phone || '';

            const imageUrl = ns.initialUserData.profileImageUrl;
            if (imageUrl) {
                ns.profilePreview.src = imageUrl;
                ns.profilePreview.style.display = 'block';
                ns.avatarPlaceholder.style.display = 'none';
            } else {
                ns.profilePreview.style.display = 'none';
                ns.avatarPlaceholder.style.display = 'block';
            }
            return true;
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat memuat data pengguna.');
            return false;
        }
    };

    ns.handleUpdateSubmission = async function(){
        ns.hideError(ns.errorMessage);
        ns.changesToSubmit = {};
        if (ns.usernameInput.value.trim() !== ns.initialUserData.username) ns.changesToSubmit.username = ns.usernameInput.value.trim();
        if (ns.emailInput.value.trim().toLowerCase() !== ns.initialUserData.email) ns.changesToSubmit.email = ns.emailInput.value.trim().toLowerCase();
        if (ns.phoneInput.value.trim() !== (ns.initialUserData.phone || '')) ns.changesToSubmit.phone = ns.phoneInput.value.trim();
        if (ns.passwordInput.value) {
            if (ns.passwordInput.value.length < 8) {
                ns.showError(ns.errorMessage, 'Password baru minimal 8 karakter.');
                return;
            }
            ns.changesToSubmit.password = ns.passwordInput.value;
        }
        if (Object.keys(ns.changesToSubmit).length === 0 && !ns.newProfileImageFile) {
            alert('Tidak ada perubahan yang dibuat.');
            return;
        }
        ns.setLoading(ns.submitBtn, true, 'Mengirim OTP...');
        try {
            await ns.sendOtpForUpdate(ns.initialUserData.username, ns.initialUserData.email);
            ns.stage = 'otp';
            ns.userDataGroup.style.display = 'none';
            ns.otpGroup.style.display = 'block';
            ns.otpEmailInfo.textContent = ns.initialUserData.email;
            ns.setLoading(ns.submitBtn, false, 'Verifikasi & Simpan');
        } catch (err) {
            ns.showError(ns.errorMessage, err.message);
            ns.setLoading(ns.submitBtn, false, 'Simpan Perubahan');
        }
    };

    ns.handleOtpVerification = async function(){
        ns.hideError(ns.errorMessage);
        const enteredOtp = ns.otpInput.value.trim();
        if (enteredOtp.length !== 6) {
            ns.showError(ns.errorMessage, 'OTP harus 6 digit.');
            return;
        }
        ns.setLoading(ns.submitBtn, true, 'Menyimpan...');
        try {
            const otpRef = ns.database.ref(`otp_requests/${ns.initialUserData.username}`);
            const snapshot = await otpRef.once('value');
            if (!snapshot.exists() || snapshot.val().code !== enteredOtp) {
                throw new Error('Kode OTP salah atau sudah kedaluwarsa.');
            }

            if (ns.newProfileImageFile) {
                // Hapus gambar lama jika ada
                await ns.deleteOldProfileImage(ns.initialUserData.profileImagePublicId);
                
                // Unggah gambar baru
                const uploadResult = await ns.uploadProfileImage(ns.newProfileImageFile);
                ns.changesToSubmit.profileImageUrl = uploadResult.secure_url;
                ns.changesToSubmit.profileImagePublicId = uploadResult.public_id;
            }

            const finalUpdateData = { ...ns.changesToSubmit };
            if (finalUpdateData.password) {
                finalUpdateData.hashedPassword = await ns.hashPassword(finalUpdateData.password, ns.currentUserSalt);
                delete finalUpdateData.password;
            }

            const userKey = ns.userKeyInput.value;
            await ns.updateUserInFirestore(userKey, finalUpdateData);
            
            // PERBAIKAN KRITIS: Perbarui localStorage setelah berhasil menyimpan ke Firestore
            if (finalUpdateData.username) localStorage.setItem('username', finalUpdateData.username);
            if (finalUpdateData.email) localStorage.setItem('email', finalUpdateData.email);
            if (finalUpdateData.phone) localStorage.setItem('phone', finalUpdateData.phone);
            if (finalUpdateData.profileImageUrl) localStorage.setItem('profileImageUrl', finalUpdateData.profileImageUrl);
            if (finalUpdateData.profileImagePublicId) localStorage.setItem('profileImagePublicId', finalUpdateData.profileImagePublicId);

            await otpRef.remove();
            alert('Data berhasil diperbarui!');
            window.location.href = 'monitor.html';
        } catch (err) {
            ns.showError(ns.errorMessage, err.message);
            ns.setLoading(ns.submitBtn, false, 'Verifikasi & Simpan');
        }
    };

    ns.wireEvents = function(){
        if (ns.settingsForm) {
            ns.settingsForm.addEventListener('submit', async e => {
                e.preventDefault();
                if (ns.stage === 'data') {
                    await ns.handleUpdateSubmission();
                } else {
                    await ns.handleOtpVerification();
                }
            });
        }
        if (ns.profileImageInput) {
            ns.profileImageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    ns.newProfileImageFile = file;
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        ns.profilePreview.src = event.target.result;
                        ns.profilePreview.style.display = 'block';
                        ns.avatarPlaceholder.style.display = 'none';
                    }
                    reader.readAsDataURL(file);
                }
            });
        }
    };

    ns.init = async function(){
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            alert('Anda harus login terlebih dahulu!');
            window.location.href = 'index.html';
            return;
        }
        ns.wireEvents();
        await ns.populateUserData();
    };
})(window.SettingsApp);
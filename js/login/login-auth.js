window.LoginApp = window.LoginApp || {};
(function(ns){
    const db = ns.db;
    const database = ns.database;
    const GAS = ns.GAS_WEB_APP_URL;

    ns.requestOtp = function(username, email, type='login'){
        ns.setLoading(true, 'Mengirim OTP...');
        return fetch(GAS, { method: 'POST', mode: 'cors', body: JSON.stringify({ username, email, type }) })
            .then(res => { if (!res.ok) throw new Error('Gagal menghubungi server.'); return res.json(); })
            .then(result => { if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP.'); ns.showError(ns.globalErrorMessage, 'OTP telah dikirim ke email Anda.', 'success'); })
            .finally(() => ns.setLoading(false, 'Login'));
    };

    ns.loginWithPassword = async function(username, password){
        ns.clearInputError(ns.usernameInput); ns.clearInputError(ns.passwordInput);
        if (!username.trim() || !password) {
            if (!username.trim()) ns.setInputError(ns.usernameInput, 'Username tidak boleh kosong.');
            if (!password) ns.setInputError(ns.passwordInput, 'Password tidak boleh kosong.');
            return;
        }
        ns.setLoading(true, 'Memvalidasi...');
        try {
            const querySnapshot = await db.collection('users').where('username', '==', username).get();
            if (querySnapshot.empty) throw new Error('Username atau Password salah.');
            const userDoc = querySnapshot.docs[0];
            ns.currentUserData = userDoc.data();
            ns.currentUserKey = userDoc.id;
            const newHash = await ns.hashPassword(password, ns.currentUserData.salt);
            if (newHash === ns.currentUserData.hashedPassword) {
                await ns.requestOtp(ns.currentUserData.username, ns.currentUserData.email, 'login');
                ns.stage = 'login_otp';
                ns.updateUI();
            } else throw new Error('Username atau Password salah.');
        } catch (err) {
            ns.showError(ns.globalErrorMessage, err.message);
            ns.setLoading(false, 'Login');
        }
    };

    ns.verifyLoginOtp = function(){
        const enteredOtp = ns.otpInput.value.trim();
        if (enteredOtp.length !== 6) { ns.setInputError(ns.otpInput, 'OTP harus 6 digit.'); return; }
        ns.setLoading(true, 'Memverifikasi...');
        const otpRef = database.ref(`otp_requests/${ns.currentUserData.username}`);
        otpRef.once('value').then((snapshot) => {
            if (!snapshot.exists() || snapshot.val().code !== enteredOtp) throw new Error('Kode OTP salah atau kedaluwarsa.');
            if ((new Date().getTime() - snapshot.val().timestamp) > (5 * 60 * 1000)) throw new Error('Kode OTP kedaluwarsa.');

            // PERBAIKAN: Menyimpan SEMUA data yang relevan ke localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', ns.currentUserData.username);
            localStorage.setItem('email', ns.currentUserData.email);
            localStorage.setItem('role', ns.currentUserData.role);
            localStorage.setItem('phone', ns.currentUserData.phone || '');
            localStorage.setItem('profileImageUrl', ns.currentUserData.profileImageUrl || '');
            localStorage.setItem('profileImagePublicId', ns.currentUserData.profileImagePublicId || ''); // Simpan publicId

            otpRef.remove();
            window.location.href = 'monitor.html';
        }).catch(error => {
            ns.showError(ns.globalErrorMessage, error.message);
            ns.setLoading(false, 'Verifikasi OTP');
        });
    };
    
    // ... sisa kode tidak berubah ...
    ns.handleForgotPasswordEmail = async function(email){
        ns.clearInputError(ns.forgotEmailInput);
        if (!email) { ns.setInputError(ns.forgotEmailInput, 'Email tidak boleh kosong.'); return; }
        ns.setLoading(true, 'Mencari Email...');
        try {
            const querySnapshot = await db.collection('users').where('email', '==', email).get();
            if (querySnapshot.empty) throw new Error('Email tidak terdaftar.');
            const userDoc = querySnapshot.docs[0];
            ns.currentUserData = userDoc.data();
            ns.currentUserKey = userDoc.id;
            await ns.requestOtp(ns.currentUserData.username, ns.currentUserData.email, 'reset');
            ns.stage = 'forgot_reset'; ns.updateUI();
        } catch (err) {
            ns.showError(ns.globalErrorMessage, err.message);
            ns.setLoading(false, 'Kirim OTP');
        }
    };
    ns.handleResetPassword = async function(enteredOtp, newPassword, confirmNewPassword){
        ns.clearInputError(ns.otpInput); ns.clearInputError(ns.newPasswordInput); ns.clearInputError(ns.confirmNewPasswordInput);
        let isValid = true;
        if (enteredOtp.length !== 6) { ns.setInputError(ns.otpInput, 'OTP harus 6 digit.'); isValid = false; }
        if (newPassword.length < 8) { ns.setInputError(ns.newPasswordInput, 'Password baru minimal 8 karakter.'); isValid = false; }
        if (newPassword !== confirmNewPassword) { ns.setInputError(ns.confirmNewPasswordInput, 'Password tidak cocok.'); isValid = false; }
        if (!isValid) return;
        ns.setLoading(true, 'Memverifikasi & Mereset...');
        try {
            const otpRef = database.ref(`otp_requests/${ns.currentUserData.username}`);
            const snapshot = await otpRef.once('value');
            if (!snapshot.exists()) throw new Error('Verifikasi gagal atau sudah kedaluwarsa.');
            if (snapshot.val().code !== enteredOtp) throw new Error('Kode OTP salah.');
            const newHashedPassword = await ns.hashPassword(newPassword, ns.currentUserData.salt);
            await db.collection('users').doc(ns.currentUserKey).update({ hashedPassword: newHashedPassword });
            await otpRef.remove();
            ns.showError(ns.globalErrorMessage, 'Password berhasil direset! Anda akan diarahkan ke halaman login.', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        } catch (err) {
            ns.showError(ns.globalErrorMessage, err.message);
            ns.setLoading(false, 'Reset Password');
        }
    };
})(window.LoginApp);
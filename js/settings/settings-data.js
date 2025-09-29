window.SettingsApp = window.SettingsApp || {};
(function(ns){
    const database = ns.database;

    ns.getUserByUsername = async function(username){
        if (!database) throw new Error('Realtime Database tidak tersedia');
        const usersRef = database.ref('Users');
        const snapshot = await usersRef.orderByChild('username').equalTo(username).once('value');
        if (!snapshot.exists()) return null;
        const key = Object.keys(snapshot.val())[0];
        return { key, data: snapshot.val()[key] };
    };

    ns.sendOtpForUpdate = async function(username, email){
        if (!ns.GAS_WEB_APP_URL) throw new Error('GAS URL belum dikonfigurasi');
        const res = await fetch(ns.GAS_WEB_APP_URL, { method:'POST', mode:'cors', body: JSON.stringify({ username, email, type:'update' }) });
        if (!res.ok) throw new Error('Gagal menghubungi server OTP');
        const result = await res.json(); if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP');
        return result;
    };

    ns.verifyOtpAndUpdateUser = async function(username, userKey, finalUpdateData){
        if (!database) throw new Error('Realtime Database tidak tersedia');
        const otpRef = database.ref(`otp_requests/${username}`);
        const snapshot = await otpRef.once('value');
        if (!snapshot.exists()) throw new Error('Kode OTP salah atau sudah kedaluwarsa.');
        // caller should have already validated OTP code equality
        await database.ref(`Users/${userKey}`).update(finalUpdateData);
        await otpRef.remove();
    };
})(window.SettingsApp);

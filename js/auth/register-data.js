window.RegisterApp = window.RegisterApp || {};
(function(ns){
    const db = ns.db;
    const database = ns.database;
    const GAS = "https://script.google.com/macros/s/AKfycbztdc2p1qUOjYlxUABdb7G4OjvPPvJ1rtTO5p70LHjH8-Fm11VGMNtcD4UBXtthyH9V/exec";
    // Cloudinary config - set your cloud name and unsigned upload preset here
    ns.CLOUDINARY_CLOUD_NAME = ns.CLOUDINARY_CLOUD_NAME || 'dca2fjndp';
    ns.CLOUDINARY_UPLOAD_PRESET = ns.CLOUDINARY_UPLOAD_PRESET || 'Unsigned';

    ns.checkUniqueAndSendOtp = async function({ username, email, phone, password, profileImageUrl=null }){
        const usersCollection = db.collection('users');
        const usernameQuery = await usersCollection.where('username','==',username).get();
        if (!usernameQuery.empty) throw new Error('Username sudah digunakan.');
        const emailQuery = await usersCollection.where('email','==',email).get();
        if (!emailQuery.empty) throw new Error('Alamat email sudah terdaftar.');

    const salt = crypto.randomUUID();
    const hashedPassword = await ns.hashPassword(password, salt);
    const temporaryUserData = { username, email, phone, hashedPassword, salt, role: 'user', profileImageUrl };

        // Send OTP via GAS
        const res = await fetch(GAS, { method: 'POST', mode: 'cors', body: JSON.stringify({ username, email, type: 'registration' }) });
        if (!res.ok) throw new Error('Gagal menghubungi server OTP.');
        const result = await res.json();
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP.');

        return temporaryUserData;
    };

    // Upload image file to Cloudinary (unsigned). Returns URL string.
    ns.uploadProfileImage = async function(file){
        if (!file) return null;
        const cloudName = ns.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = ns.CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || cloudName.includes('<YOUR_')) throw new Error('Cloudinary belum dikonfigurasi pada aplikasi.');
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
        const form = new FormData();
        form.append('file', file);
        form.append('upload_preset', uploadPreset);
        const res = await fetch(url, { method: 'POST', body: form });
        if (!res.ok) throw new Error('Gagal mengunggah foto profil.');
        const json = await res.json();
        return json.secure_url || json.url || null;
    };

    ns.verifyAndCreateUser = async function(temporaryUserData, enteredOtp){
        const otpRef = database.ref(`registration_otps/${temporaryUserData.username}`);
        const snapshot = await otpRef.once('value');
        if (!snapshot.exists() || snapshot.val().code !== enteredOtp) throw new Error('Kode OTP salah atau kedaluwarsa.');

        await db.collection('users').add(temporaryUserData);
        await otpRef.remove();
    };
})(window.RegisterApp);

window.RegisterApp = window.RegisterApp || {};
(function(ns){
    const db = ns.db;
    const database = ns.database;
    const GAS = "https://script.google.com/macros/s/AKfycbztdc2p1qUOjYlxUABdb7G4OjvPPvJ1rtTO5p70LHjH8-Fm11VGMNtcD4UBXtthyH9V/exec";
    
    ns.CLOUDINARY_CLOUD_NAME = ns.CLOUDINARY_CLOUD_NAME || 'dca2fjndp';
    ns.CLOUDINARY_UPLOAD_PRESET = ns.CLOUDINARY_UPLOAD_PRESET || 'dbimage';

    ns.checkUniqueData = async function({ username, email }){
        const usersCollection = db.collection('users');
        const usernameQuery = await usersCollection.where('username','==',username).get();
        if (!usernameQuery.empty) throw new Error('Username sudah digunakan.');
        
        const emailQuery = await usersCollection.where('email','==',email).get();
        if (!emailQuery.empty) throw new Error('Alamat email sudah terdaftar.');
    };

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
        return {
            url: json.secure_url || json.url,
            publicId: json.public_id // Menggunakan 'publicId' agar konsisten
        };
    };

    ns.sendOtpForRegistration = async function(userData) {
        const { username, email } = userData;
        const res = await fetch(GAS, { method: 'POST', mode: 'cors', body: JSON.stringify({ username, email, type: 'registration' }) });
        if (!res.ok) throw new Error('Gagal menghubungi server OTP.');
        
        const result = await res.json();
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP.');
        
        const salt = crypto.randomUUID();
        const hashedPassword = await ns.hashPassword(userData.password, salt);
        
        return { ...userData, hashedPassword, salt, role: 'user' };
    };
    
    ns.verifyAndCreateUser = async function(temporaryUserData, enteredOtp){
        const otpRef = database.ref(`registration_otps/${temporaryUserData.username}`);
        const snapshot = await otpRef.once('value');
        if (!snapshot.exists() || snapshot.val().code !== enteredOtp) throw new Error('Kode OTP salah atau kedaluwarsa.');

        const finalUserData = { ...temporaryUserData };
        delete finalUserData.password;

        await db.collection('users').add(finalUserData);
        await otpRef.remove();
    };

})(window.RegisterApp);
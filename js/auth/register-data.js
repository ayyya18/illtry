window.RegisterApp = window.RegisterApp || {};
(function(ns){
    const db = ns.db;
    const database = ns.database;
    const GAS = "https://script.google.com/macros/s/AKfycbztdc2p1qUOjYlxUABdb7G4OjvPPvJ1rtTO5p70LHjH8-Fm11VGMNtcD4UBXtthyH9V/exec";

    ns.checkUniqueAndSendOtp = async function({ username, email, phone, password }){
        const usersCollection = db.collection('users');
        const usernameQuery = await usersCollection.where('username','==',username).get();
        if (!usernameQuery.empty) throw new Error('Username sudah digunakan.');
        const emailQuery = await usersCollection.where('email','==',email).get();
        if (!emailQuery.empty) throw new Error('Alamat email sudah terdaftar.');

        const salt = crypto.randomUUID();
        const hashedPassword = await ns.hashPassword(password, salt);
        const temporaryUserData = { username, email, phone, hashedPassword, salt, role: 'user' };

        // Send OTP via GAS
        const res = await fetch(GAS, { method: 'POST', mode: 'cors', body: JSON.stringify({ username, email, type: 'registration' }) });
        if (!res.ok) throw new Error('Gagal menghubungi server OTP.');
        const result = await res.json();
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP.');

        return temporaryUserData;
    };

    ns.verifyAndCreateUser = async function(temporaryUserData, enteredOtp){
        const otpRef = database.ref(`registration_otps/${temporaryUserData.username}`);
        const snapshot = await otpRef.once('value');
        if (!snapshot.exists() || snapshot.val().code !== enteredOtp) throw new Error('Kode OTP salah atau kedaluwarsa.');

        await db.collection('users').add(temporaryUserData);
        await otpRef.remove();
    };
})(window.RegisterApp);

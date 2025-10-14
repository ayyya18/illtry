window.SettingsApp = window.SettingsApp || {};
(function(ns){
    const db = ns.firestore; // Gunakan Firestore
    const database = ns.database; // Tetap untuk OTP

    // Fungsi untuk mengambil data user dari FIRESTORE
    ns.getUserByUsername = async function(username){
        if (!db) throw new Error('Firestore tidak tersedia');
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).limit(1).get();
        
        if (snapshot.empty) return null;
        
        const userDoc = snapshot.docs[0];
        return { key: userDoc.id, data: userDoc.data() };
    };

    // Fungsi untuk mengunggah gambar baru ke Cloudinary
    ns.uploadProfileImage = async function(file){
        if (!file) return null;
        const cloudName = ns.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = ns.CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) throw new Error('Konfigurasi Cloudinary tidak ditemukan.');
        
        const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', uploadPreset);
        
        const response = await fetch(url, { method: 'POST', body: formData });
        if (!response.ok) throw new Error('Gagal mengunggah foto baru.');
        
        const data = await response.json();
        return data.secure_url;
    };

    // Fungsi untuk mengirim OTP (tidak ada perubahan)
    ns.sendOtpForUpdate = async function(username, email){
        if (!ns.GAS_WEB_APP_URL) throw new Error('GAS URL belum dikonfigurasi');
        const res = await fetch(ns.GAS_WEB_APP_URL, { method:'POST', mode:'cors', body: JSON.stringify({ username, email, type:'update' }) });
        if (!res.ok) throw new Error('Gagal menghubungi server OTP');
        const result = await res.json(); 
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP');
        return result;
    };

    // Fungsi untuk update data di FIRESTORE
    ns.updateUserInFirestore = async function(userKey, updateData) {
        if (!db) throw new Error('Firestore tidak tersedia');
        const userRef = db.collection('users').doc(userKey);
        await userRef.update(updateData);
    };

})(window.SettingsApp);
window.SettingsApp = window.SettingsApp || {};
(function(ns){
    const db = ns.firestore; 
    const database = ns.database;

    ns.getUserByUsername = async function(username){
        if (!db) throw new Error('Firestore tidak tersedia');
        const usersRef = db.collection('users');
        const snapshot = await usersRef.where('username', '==', username).limit(1).get();
        if (snapshot.empty) return null;
        const userDoc = snapshot.docs[0];
        return { key: userDoc.id, data: userDoc.data() };
    };

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
        return {
            secure_url: data.secure_url,
            public_id: data.public_id
        };
    };

    // --- PERUBAHAN UTAMA DI SINI ---
    ns.deleteOldProfileImage = async function(publicId) {
        if (!publicId) {
            console.log("Tidak ada public_id lama, tidak ada yang dihapus.");
            return; 
        }
        
        // GANTI URL INI DENGAN URL GOOGLE APPS SCRIPT ANDA
        const backendUrl = 'https://script.google.com/macros/s/AKfycbxG000rlEbiY1qhep9124yjQf9v_KZja4I4QN5I5h-hL7TEhb_xdw_LbVstD4f7-tvI/exec'; // <--- GANTI INI

        try {
            const response = await fetch(backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' }, // Diperlukan oleh Apps Script
                body: JSON.stringify({ public_id: publicId }),
                mode: 'no-cors' // Penting untuk menghindari error CORS dari Apps Script
            });
            console.log("Permintaan hapus telah dikirim ke backend.");
        } catch (error) {
            console.error("Gagal mengirim permintaan hapus ke backend:", error);
            // Anda bisa memutuskan untuk tetap melanjutkan atau menampilkan pesan error
        }
    };
    
    ns.sendOtpForUpdate = async function(username, email){
        if (!ns.GAS_WEB_APP_URL) throw new Error('GAS URL belum dikonfigurasi');
        const res = await fetch(ns.GAS_WEB_APP_URL, { method:'POST', mode:'cors', body: JSON.stringify({ username, email, type:'update' }) });
        if (!res.ok) throw new Error('Gagal menghubungi server OTP');
        const result = await res.json(); 
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP');
        return result;
    };

    ns.updateUserInFirestore = async function(userKey, updateData) {
        if (!db) throw new Error('Firestore tidak tersedia');
        const userRef = db.collection('users').doc(userKey);
        await userRef.update(updateData);
    };

})(window.SettingsApp);
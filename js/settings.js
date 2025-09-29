// --- GANTI DENGAN URL WEB APP ANDA UNTUK MENGIRIM OTP ---
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzdriRvtc-uI4SBu17FaZ51LZTRqhu5nJOolNqPrtg2xESOXZP3yido6SJ1jIjLzPNg/exec";
// ---------------------------------------------------------

// --- Konfigurasi dan Inisialisasi Firebase ---
const firebaseConfig = {
    apiKey: "AIzaSyBocEu3xpflgxTLfGu7KpqKl9CKq56nQTs",
    authDomain: "illtry-1b834.firebaseapp.com",
    databaseURL: "https://illtry-1b834-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "illtry-1b834",
    storageBucket: "illtry-1b834.appspot.com",
    messagingSenderId: "392211014938",
    appId: "1:392211014938:web:17e5f6ae3db13ccdd638a3",
    measurementId: "G-2SWV2QKWN5"
};
const app = firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// --- Elemen DOM ---
const settingsForm = document.getElementById('settings-form');
const userDataGroup = document.getElementById('user-data-group');
const otpGroup = document.getElementById('otp-group');
const userKeyInput = document.getElementById('user-key');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const otpInput = document.getElementById('otp');
const otpEmailInfo = document.getElementById('otp-email-info');
const submitBtn = document.getElementById('submit-btn');
const errorMessage = document.getElementById('error-message');

// --- Variabel Global untuk Menyimpan State ---
let stage = 'data';
let initialUserData = {};
let currentUserSalt = null;
let changesToSubmit = {};

// --- Fungsi Hashing ---
const str2ab = (str) => new Uint8Array(str.split('').map(c => c.charCodeAt(0))).buffer;
const ab2hex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
const hashPassword = async (password, salt) => {
    const passwordBuffer = str2ab(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', passwordBuffer);
    return ab2hex(hashBuffer);
};

// --- Fungsi Bantuan ---
const setLoading = (isLoading, text) => { submitBtn.disabled = isLoading; submitBtn.textContent = text; };
const showError = (message) => { errorMessage.textContent = message; errorMessage.style.display = 'block'; };

// --- Fungsi Utama ---
async function populateUserData() {
    const storedUsername = localStorage.getItem('username');
    if (!storedUsername) {
        alert("Sesi tidak ditemukan, silakan login kembali.");
        window.location.href = 'index.html';
        return false;
    }
    const usersRef = database.ref('Users');
    const snapshot = await usersRef.orderByChild('username').equalTo(storedUsername).once('value');
    if (snapshot.exists()) {
        const userKey = Object.keys(snapshot.val())[0];
        initialUserData = snapshot.val()[userKey];
        userKeyInput.value = userKey;
        currentUserSalt = initialUserData.salt;
        usernameInput.value = initialUserData.username;
        emailInput.value = initialUserData.email;
        phoneInput.value = initialUserData.phone || '';
        return true;
    } else {
        alert("Gagal memuat data pengguna.");
        return false;
    }
}

// --- Logika yang Disesuaikan Seperti Halaman Registrasi ---

// 1. Fungsi untuk menangani pengajuan perubahan dan meminta OTP
async function handleUpdateSubmission() {
    errorMessage.style.display = 'none';
    changesToSubmit = {};
    if (usernameInput.value.trim() !== initialUserData.username) changesToSubmit.username = usernameInput.value.trim();
    if (emailInput.value.trim().toLowerCase() !== initialUserData.email) changesToSubmit.email = emailInput.value.trim().toLowerCase();
    if (phoneInput.value.trim() !== (initialUserData.phone || '')) changesToSubmit.phone = phoneInput.value.trim();
    if (passwordInput.value) {
        if (passwordInput.value.length < 8) { showError("Password baru minimal 8 karakter."); return; }
        changesToSubmit.password = passwordInput.value;
    }
    if (Object.keys(changesToSubmit).length === 0) { alert("Tidak ada perubahan yang dibuat."); return; }

    setLoading(true, 'Mengirim OTP...');
    try {
        const response = await fetch(GAS_WEB_APP_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ username: initialUserData.username, email: initialUserData.email, type: 'update' }) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP.');

        stage = 'otp';
        userDataGroup.style.display = 'none';
        otpGroup.style.display = 'block';
        otpEmailInfo.textContent = initialUserData.email;
        setLoading(false, 'Verifikasi & Simpan');
    } catch (error) {
        showError(error.message);
        setLoading(false, 'Simpan Perubahan');
    }
}

// 2. Fungsi untuk memverifikasi OTP dan menyimpan data
async function handleOtpVerification() {
    errorMessage.style.display = 'none';
    const enteredOtp = otpInput.value.trim();
    if (enteredOtp.length !== 6) { showError("OTP harus 6 digit."); return; }

    setLoading(true, 'Menyimpan...');
    try {
        const otpRef = database.ref(`otp_requests/${initialUserData.username}`);
        const snapshot = await otpRef.once('value');
        if (!snapshot.exists() || snapshot.val().code !== enteredOtp) {
            throw new Error("Kode OTP salah atau sudah kedaluwarsa.");
        }

        const finalUpdateData = { ...changesToSubmit };
        if (finalUpdateData.password) {
            finalUpdateData.hashedPassword = await hashPassword(finalUpdateData.password, currentUserSalt);
            delete finalUpdateData.password;
        }

        const userKey = userKeyInput.value;
        await database.ref(`Users/${userKey}`).update(finalUpdateData);
        
        if (finalUpdateData.username) localStorage.setItem('username', finalUpdateData.username);
        if (finalUpdateData.email) localStorage.setItem('email', finalUpdateData.email);

        await otpRef.remove();
        alert("Data berhasil diperbarui!");
        window.location.href = 'monitor.html';
    } catch (error) {
        showError(error.message);
        setLoading(false, 'Verifikasi & Simpan');
    }
}

// --- Event Listener & Inisialisasi ---
document.addEventListener('DOMContentLoaded', async function() {
    if (localStorage.getItem("isLoggedIn") !== "true") {
        alert("Anda harus login terlebih dahulu!");
        window.location.href = 'index.html';
        return;
    }

    const isDataLoaded = await populateUserData();
    if (isDataLoaded) {
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (stage === 'data') {
                await handleUpdateSubmission();
            } else {
                await handleOtpVerification();
            }
        });
    }
});
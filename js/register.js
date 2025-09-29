const firebaseConfig = {
    apiKey: "AIzaSyBocEu3xpflgxTLfGu7KpqKl9CKq56nQTs",
    authDomain: "illtry-1b834.firebaseapp.com",
    databaseURL: "https://illtry-1b834-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "illtry-1b834",
    storageBucket: "illtry-1b834.firebasestorage.app",
    messagingSenderId: "392211014938",
    appId: "1:392211014938:web:17e5f6ae3db13ccdd638a3",
    measurementId: "G-2SWV2QKWN5"
};
const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbztdc2p1qUOjYlxUABdb7G4OjvPPvJ1rtTO5p70LHjH8-Fm11VGMNtcD4UBXtthyH9V/exec";

// Inisialisasi layanan Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Untuk Firestore
const database = firebase.database(); // Untuk OTP di Realtime Database

// --- Elemen DOM ---
const registerForm = document.getElementById('registerForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const phoneInput = document.getElementById('phone');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerButton = document.getElementById('registerButton');
const globalErrorMessage = document.getElementById('error-message');
const initialDataGroup = document.getElementById('initial-data-group');
const otpGroup = document.getElementById('otp-group');
const otpInput = document.getElementById('otp');

let registrationStage = 'input';
let temporaryUserData = {};

// --- Fungsi Bantuan ---
const setInputError = (input, message) => { const c = input.parentElement; c.classList.add('error'); c.querySelector('.error-text').innerText = message; c.querySelector('.error-text').style.display = 'block'; };
const clearInputError = (input) => { const c = input.parentElement; c.classList.remove('error'); c.querySelector('.error-text').style.display = 'none'; };
const setLoading = (isLoading, text) => { registerButton.disabled = isLoading; registerButton.textContent = text; };
const showError = (message, type = 'error') => { globalErrorMessage.textContent = message; globalErrorMessage.style.backgroundColor = type === 'error' ? 'rgba(211, 47, 47, 0.2)' : 'rgba(56, 142, 60, 0.2)'; globalErrorMessage.style.display = 'block'; };

// --- Fungsi Kriptografi ---
const str2ab = (str) => new Uint8Array(str.split('').map(c => c.charCodeAt(0))).buffer;
const ab2hex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
const hashPassword = async (password, salt) => { const hB = await crypto.subtle.digest('SHA-256', str2ab(password + salt)); return ab2hex(hB); };

// --- Fungsi Validasi ---
const validateUsername = () => { if (usernameInput.value.trim().length < 5) { setInputError(usernameInput, 'Username minimal 5 karakter.'); return false; } clearInputError(usernameInput); return true; };
const validateEmail = () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim())) { setInputError(emailInput, 'Format email tidak valid.'); return false; } clearInputError(emailInput); return true; };
const validatePhone = () => { if (!/^\d{9,15}$/.test(phoneInput.value.trim())) { setInputError(phoneInput, 'Nomor telepon harus 9-15 digit angka.'); return false; } clearInputError(phoneInput); return true; };
const validatePassword = () => { if (passwordInput.value.length < 8) { setInputError(passwordInput, 'Password minimal 8 karakter.'); return false; } clearInputError(passwordInput); return true; };
const validateConfirmPassword = () => { if (passwordInput.value !== confirmPasswordInput.value) { setInputError(confirmPasswordInput, 'Password tidak cocok.'); return false; } clearInputError(confirmPasswordInput); return true; };

// --- Event Listener ---
usernameInput.addEventListener('blur', validateUsername);
emailInput.addEventListener('blur', validateEmail);
phoneInput.addEventListener('blur', validatePhone);
passwordInput.addEventListener('blur', validatePassword);
confirmPasswordInput.addEventListener('blur', validateConfirmPassword);

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    globalErrorMessage.style.display = 'none';
    if (registrationStage === 'input') await handleInitialRegistration();
    else await handleOtpVerification();
});

// --- FUNGSI UTAMA ---
async function handleInitialRegistration() {
    const isValid = [validateUsername(), validateEmail(), validatePhone(), validatePassword(), validateConfirmPassword()].every(Boolean);
    if (!isValid) return;
    setLoading(true, 'Memeriksa data...');
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const phone = phoneInput.value.trim();
    
    try {
        const usersCollection = db.collection('users');
        
        const usernameQuery = await usersCollection.where('username', '==', username).get();
        if (!usernameQuery.empty) { throw new Error("Username sudah digunakan."); }

        const emailQuery = await usersCollection.where('email', '==', email).get();
        if (!emailQuery.empty) { throw new Error("Alamat email sudah terdaftar."); }
        
        setLoading(true, 'Mengirim OTP...');
        const salt = crypto.randomUUID();
        const hashedPassword = await hashPassword(passwordInput.value, salt);
        temporaryUserData = { username, email, phone, hashedPassword, salt, role: 'user' };
        
        const response = await fetch(GAS_WEB_APP_URL, { method: 'POST', mode: 'cors', body: JSON.stringify({ username, email, type: 'registration' }) });
        const result = await response.json();
        if (result.status !== 'success') throw new Error(result.message || 'Gagal mengirim OTP.');
        
        registrationStage = 'otp';
        initialDataGroup.style.display = 'none';
        otpGroup.style.display = 'block';
        otpInput.focus();
        setLoading(false, 'Verifikasi Akun');
        showError("OTP telah dikirim ke email Anda.", "success");
    } catch (error) { showError(error.message); setLoading(false, 'Lanjutkan'); }
}

async function handleOtpVerification() {
    const enteredOtp = otpInput.value.trim();
    if (enteredOtp.length !== 6) { setInputError(otpInput, "OTP harus 6 digit."); return; }
    setLoading(true, 'Memverifikasi...');
    try {
        const otpRef = database.ref(`registration_otps/${temporaryUserData.username}`);
        const snapshot = await otpRef.once('value');
        if (!snapshot.exists() || snapshot.val().code !== enteredOtp) {
            throw new Error("Kode OTP salah atau kedaluwarsa.");
        }
        
        await db.collection('users').add(temporaryUserData);
        
        await otpRef.remove();
        showError("Akun berhasil diverifikasi! Anda akan diarahkan ke halaman login", "success");
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    } catch (error) { showError(error.message); setLoading(false, 'Verifikasi Akun'); }
}

// --- Logika untuk Fitur Lihat Password ---
const togglePassword = document.getElementById('togglePassword');
if (togglePassword) {
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        const icon = this.querySelector('i');
        icon.classList.toggle('fa-eye');
        icon.classList.toggle('fa-eye-slash');
    });
}

// --- AWAL: Logika untuk Slider Gambar ---
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelector('.slides');
    // Pastikan elemen slider ada sebelum menjalankan logika
    if(slides) {
        const slideCount = document.querySelectorAll('.slide').length;
        const dotsContainer = document.querySelector('.slider-dots');
        let currentSlide = 0;
        
        // Buat dots navigasi secara dinamis
        for (let i = 0; i < slideCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dotsContainer.appendChild(dot);
        }
        
        const dots = document.querySelectorAll('.dot');
        
        function showSlide(index) {
            // Geser container slides
            slides.style.transform = `translateX(-${index * (100 / slideCount)}%)`;
            // Update dot yang aktif
            dots.forEach(dot => dot.classList.remove('active'));
            dots[index].classList.add('active');
        }

        // Tampilkan slide pertama saat halaman dimuat
        showSlide(0);

        // Atur interval untuk slide otomatis setiap 5 detik
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slideCount; // Pindah ke slide berikutnya
            showSlide(currentSlide);
        }, 3000); // 5000 milidetik = 5 detik
    }
});
// --- AKHIR: Logika untuk Slider Gambar ---
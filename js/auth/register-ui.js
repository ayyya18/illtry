window.RegisterApp = window.RegisterApp || {};
(function(ns){
    ns.registerForm = ns.q('#registerForm');
    ns.cardTitle = ns.q('#card-title');
    
    ns.initialDataGroup = ns.q('#initial-data-group');
    ns.uploadGroup = ns.q('#upload-group');
    ns.otpGroup = ns.q('#otp-group');
    
    ns.usernameInput = ns.q('#username');
    ns.emailInput = ns.q('#email');
    ns.phoneInput = ns.q('#phone');
    ns.passwordInput = ns.q('#password');
    ns.confirmPasswordInput = ns.q('#confirmPassword');
    ns.profileImageInput = ns.q('#profileImage');
    ns.otpInput = ns.q('#otp');
    
    ns.profilePreviewImg = ns.q('#profilePreview');
    ns.uploadPlaceholder = ns.q('#upload-placeholder');
    ns.profileImageError = ns.q('#profileImageError');
    ns.registerButton = ns.q('#registerButton');
    ns.globalErrorMessage = ns.q('#error-message');

    ns.registrationStage = 'input';
    ns.temporaryUserData = {};

    ns.validateUsername = () => { if (ns.usernameInput.value.trim().length < 5) { ns.setInputError(ns.usernameInput,'Username minimal 5 karakter.'); return false; } ns.clearInputError(ns.usernameInput); return true; };
    ns.validateEmail = () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ns.emailInput.value.trim())) { ns.setInputError(ns.emailInput,'Format email tidak valid.'); return false; } ns.clearInputError(ns.emailInput); return true; };
    ns.validatePhone = () => { if (!/^\d{9,15}$/.test(ns.phoneInput.value.trim())) { ns.setInputError(ns.phoneInput,'Nomor telepon harus 9-15 digit angka.'); return false; } ns.clearInputError(ns.phoneInput); return true; };
    ns.validatePassword = () => { if (ns.passwordInput.value.length < 8) { ns.setInputError(ns.passwordInput,'Password minimal 8 karakter.'); return false; } ns.clearInputError(ns.passwordInput); return true; };
    ns.validateConfirmPassword = () => { if (ns.passwordInput.value !== ns.confirmPasswordInput.value) { ns.setInputError(ns.confirmPasswordInput,'Password tidak cocok.'); return false; } ns.clearInputError(ns.confirmPasswordInput); return true; };

    ns.setLoading = (isLoading, text) => { if (ns.registerButton) { ns.registerButton.disabled = isLoading; ns.registerButton.textContent = text; } };
    
    ns.updateUIForStage = function() {
        ns.initialDataGroup.style.display = 'none';
        ns.uploadGroup.style.display = 'none';
        ns.otpGroup.style.display = 'none';
        ns.globalErrorMessage.style.display = 'none';

        if (ns.registrationStage === 'input') {
            ns.cardTitle.textContent = 'Buat Akun Baru';
            ns.initialDataGroup.style.display = 'block';
            ns.setLoading(false, 'Lanjutkan');
        } else if (ns.registrationStage === 'upload') {
            ns.cardTitle.textContent = 'Unggah Foto Profil';
            ns.uploadGroup.style.display = 'block';
            ns.setLoading(false, 'Kirim OTP');
        } else if (ns.registrationStage === 'otp') {
            ns.cardTitle.textContent = 'Verifikasi Akun Anda';
            ns.otpGroup.style.display = 'block';
            ns.otpInput.focus();
            ns.setLoading(false, 'Verifikasi & Daftar');
        }
    };

    ns.handleFormSubmit = async function(e) {
        e.preventDefault();
        ns.globalErrorMessage.style.display = 'none';

        if (ns.registrationStage === 'input') {
            await ns.handleInitialData();
        } else if (ns.registrationStage === 'upload') {
            await ns.handleImageUploadAndOtp();
        } else if (ns.registrationStage === 'otp') {
            await ns.handleOtpVerification();
        }
    };

    ns.handleInitialData = async function() {
        const isValid = [
            ns.validateUsername(), ns.validateEmail(), ns.validatePhone(), 
            ns.validatePassword(), ns.validateConfirmPassword()
        ].every(Boolean);
        
        if (!isValid) return;

        ns.setLoading(true, 'Memeriksa data...');
        const userData = {
            username: ns.usernameInput.value.trim(),
            email: ns.emailInput.value.trim().toLowerCase(),
            phone: ns.phoneInput.value.trim(),
            password: ns.passwordInput.value
        };

        try {
            await ns.checkUniqueData(userData);
            ns.temporaryUserData = userData;
            ns.registrationStage = 'upload';
            ns.updateUIForStage();
        } catch (err) {
            ns.showError(ns.globalErrorMessage, err.message);
            ns.setLoading(false, 'Lanjutkan');
        }
    };

    ns.handleImageUploadAndOtp = async function() {
        const file = ns.profileImageInput.files[0];
        if (!file) {
            ns.profileImageError.textContent = 'Silakan pilih file gambar.';
            return;
        }
        ns.profileImageError.textContent = '';
        
        ns.setLoading(true, 'Mengunggah foto...');
        try {
            const profileImageUrl = await ns.uploadProfileImage(file);
            ns.temporaryUserData.profileImageUrl = profileImageUrl;

            ns.setLoading(true, 'Mengirim OTP...');
            const fullUserData = await ns.sendOtpForRegistration(ns.temporaryUserData);
            ns.temporaryUserData = fullUserData;
            
            ns.registrationStage = 'otp';
            ns.updateUIForStage();
            ns.showError(ns.globalErrorMessage, 'OTP telah dikirim ke email Anda.', 'success');
        } catch (err) {
            ns.showError(ns.globalErrorMessage, err.message);
            ns.setLoading(false, 'Kirim OTP');
        }
    };

    ns.handleOtpVerification = async function() {
        const enteredOtp = ns.otpInput.value.trim();
        if (enteredOtp.length !== 6) {
            ns.setInputError(ns.otpInput, 'OTP harus 6 digit.');
            return;
        }
        
        ns.setLoading(true, 'Memverifikasi...');
        try {
            await ns.verifyAndCreateUser(ns.temporaryUserData, enteredOtp);
            ns.showError(ns.globalErrorMessage, 'Akun berhasil dibuat! Anda akan diarahkan ke halaman login.', 'success');
            setTimeout(() => { window.location.href = 'index.html'; }, 3000);
        } catch (err) {
            ns.showError(ns.globalErrorMessage, err.message);
            ns.setLoading(false, 'Verifikasi & Daftar');
        }
    };

    ns.wireEvents = function() {
        ns.registerForm.addEventListener('submit', ns.handleFormSubmit);

        ns.usernameInput.addEventListener('blur', ns.validateUsername);
        ns.emailInput.addEventListener('blur', ns.validateEmail);
        ns.phoneInput.addEventListener('blur', ns.validatePhone);
        ns.passwordInput.addEventListener('blur', ns.validatePassword);
        ns.confirmPasswordInput.addEventListener('blur', ns.validateConfirmPassword);

        let currentObjectUrl = null;
        ns.profileImageInput.addEventListener('change', function() {
            ns.profileImageError.textContent = '';
            const file = this.files[0];
            if (file) {
                if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
                currentObjectUrl = URL.createObjectURL(file);
                ns.profilePreviewImg.src = currentObjectUrl;
                ns.profilePreviewImg.classList.remove('hidden');
                ns.uploadPlaceholder.classList.add('hidden');
            } else {
                if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
                ns.profilePreviewImg.src = '#';
                ns.profilePreviewImg.classList.add('hidden');
                ns.uploadPlaceholder.classList.remove('hidden');
            }
        });
        window.addEventListener('beforeunload', () => { if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl); });

        const togglePassword = ns.q('#togglePassword');
        if (togglePassword) {
            togglePassword.addEventListener('click', function() {
                const type = ns.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                ns.passwordInput.setAttribute('type', type);
                this.querySelector('i').classList.toggle('fa-eye-slash');
            });
        }
    };

    ns.initSlider = function(){
        const slides = document.querySelector('.slides');
        if (!slides) return;
        const slideCount = document.querySelectorAll('.slide').length || 1;
        const dotsContainer = document.querySelector('.slider-dots');
        dotsContainer.innerHTML = '';
        let currentSlide = 0;
        for (let i=0; i < slideCount; i++) {
            const dot = document.createElement('div');
            dot.classList.add('dot');
            dotsContainer.appendChild(dot);
        }
        const dots = document.querySelectorAll('.dot');
        function showSlide(index) {
            slides.style.transform = `translateX(-${index * (100 / slideCount)}%)`;
            dots.forEach(d => d.classList.remove('active'));
            if (dots[index]) dots[index].classList.add('active');
        }
        showSlide(0);
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slideCount;
            showSlide(currentSlide);
        }, 3000);
    };

    ns.init = function() {
        ns.wireEvents();
        ns.initSlider();
        ns.updateUIForStage();
    };

})(window.RegisterApp);
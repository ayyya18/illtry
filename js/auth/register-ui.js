window.RegisterApp = window.RegisterApp || {};
(function(ns){
    // Cache DOM elements
    ns.registerForm = ns.q('#registerForm');
    ns.usernameInput = ns.q('#username');
    ns.emailInput = ns.q('#email');
    ns.phoneInput = ns.q('#phone');
    ns.passwordInput = ns.q('#password');
    ns.confirmPasswordInput = ns.q('#confirmPassword');
    ns.profileImageInput = ns.q('#profileImage');
    ns.profilePreviewImg = ns.q('#profilePreview');
    ns.registerButton = ns.q('#registerButton');
    ns.globalErrorMessage = ns.q('#error-message');
    ns.initialDataGroup = ns.q('#initial-data-group');
    ns.otpGroup = ns.q('#otp-group');
    ns.otpInput = ns.q('#otp');

    ns.registrationStage = 'input';
    ns.temporaryUserData = null;

    // Validation
    ns.validateUsername = () => { if (ns.usernameInput.value.trim().length < 5) { ns.setInputError(ns.usernameInput,'Username minimal 5 karakter.'); return false; } ns.clearInputError(ns.usernameInput); return true; };
    ns.validateEmail = () => { if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ns.emailInput.value.trim())) { ns.setInputError(ns.emailInput,'Format email tidak valid.'); return false; } ns.clearInputError(ns.emailInput); return true; };
    ns.validatePhone = () => { if (!/^\d{9,15}$/.test(ns.phoneInput.value.trim())) { ns.setInputError(ns.phoneInput,'Nomor telepon harus 9-15 digit angka.'); return false; } ns.clearInputError(ns.phoneInput); return true; };
    ns.validatePassword = () => { if (ns.passwordInput.value.length < 8) { ns.setInputError(ns.passwordInput,'Password minimal 8 karakter.'); return false; } ns.clearInputError(ns.passwordInput); return true; };
    ns.validateConfirmPassword = () => { if (ns.passwordInput.value !== ns.confirmPasswordInput.value) { ns.setInputError(ns.confirmPasswordInput,'Password tidak cocok.'); return false; } ns.clearInputError(ns.confirmPasswordInput); return true; };

    ns.setLoading = (isLoading, text) => { if (ns.registerButton) { ns.registerButton.disabled = isLoading; ns.registerButton.textContent = text; } };

    ns.wireEvents = function(){
        ns.usernameInput.addEventListener('blur', ns.validateUsername);
        ns.emailInput.addEventListener('blur', ns.validateEmail);
        ns.phoneInput.addEventListener('blur', ns.validatePhone);
        ns.passwordInput.addEventListener('blur', ns.validatePassword);
        ns.confirmPasswordInput.addEventListener('blur', ns.validateConfirmPassword);

        ns.registerForm.addEventListener('submit', async function(e){
            e.preventDefault();
            ns.globalErrorMessage.style.display = 'none';
            if (ns.registrationStage === 'input') await ns.handleInitialRegistration();
            else await ns.handleOtpVerification();
        });

        // Profile image preview
        if (ns.profileImageInput && ns.profilePreviewImg) {
            ns.profileImageInput.addEventListener('change', function(){
                const file = this.files && this.files[0];
                if (file) {
                    const url = URL.createObjectURL(file);
                    ns.profilePreviewImg.src = url; ns.profilePreviewImg.style.display = 'block';
                } else { ns.profilePreviewImg.src = ''; ns.profilePreviewImg.style.display = 'none'; }
            });
        }

        const togglePassword = ns.q('#togglePassword');
        if (togglePassword){ togglePassword.addEventListener('click', function(){ const type = ns.passwordInput.getAttribute('type') === 'password' ? 'text' : 'password'; ns.passwordInput.setAttribute('type', type); const icon = this.querySelector('i'); icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash'); }); }
    };

    // Attach handler hooks to data module functions
    ns.handleInitialRegistration = async function(){
        const ok = [ns.validateUsername(), ns.validateEmail(), ns.validatePhone(), ns.validatePassword(), ns.validateConfirmPassword()].every(Boolean);
        if (!ok) return;
        ns.setLoading(true,'Memeriksa data...');
        try {
            const username = ns.usernameInput.value.trim();
            const email = ns.emailInput.value.trim().toLowerCase();
            const phone = ns.phoneInput.value.trim();
            const password = ns.passwordInput.value;
            // If a profile image selected, upload it first
            let profileImageUrl = null;
            try {
                const file = ns.profileImageInput && ns.profileImageInput.files && ns.profileImageInput.files[0];
                if (file) {
                    ns.setLoading(true, 'Mengunggah foto...');
                    profileImageUrl = await ns.uploadProfileImage(file);
                }
            } catch (uploadErr) {
                ns.showError(ns.globalErrorMessage, uploadErr.message || 'Gagal mengunggah foto.');
                ns.setLoading(false, 'Lanjutkan');
                return;
            }
            const tmp = await ns.checkUniqueAndSendOtp({ username, email, phone, password, profileImageUrl });
            ns.temporaryUserData = tmp;
            ns.registrationStage = 'otp';
            if (ns.initialDataGroup) ns.initialDataGroup.style.display = 'none';
            if (ns.otpGroup) ns.otpGroup.style.display = 'block';
            if (ns.otpInput) ns.otpInput.focus();
            ns.setLoading(false,'Verifikasi Akun');
            ns.showError(ns.globalErrorMessage,'OTP telah dikirim ke email Anda.','success');
        } catch (err) { ns.showError(ns.globalErrorMessage, err.message); ns.setLoading(false,'Lanjutkan'); }
    };

    ns.handleOtpVerification = async function(){
        const enteredOtp = ns.otpInput.value.trim();
        if (enteredOtp.length !== 6) { ns.setInputError(ns.otpInput,'OTP harus 6 digit.'); return; }
        ns.setLoading(true,'Memverifikasi...');
        try {
            await ns.verifyAndCreateUser(ns.temporaryUserData, enteredOtp);
            ns.showError(ns.globalErrorMessage,'Akun berhasil diverifikasi! Anda akan diarahkan ke halaman login','success');
            setTimeout(()=>{ window.location.href = 'index.html'; }, 3000);
        } catch (err) { ns.showError(ns.globalErrorMessage, err.message); ns.setLoading(false,'Verifikasi Akun'); }
    };

    // Slider init
    ns.initSlider = function(){
        const slides = document.querySelector('.slides');
        if (!slides) return;
        const slideCount = document.querySelectorAll('.slide').length || 1;
        const dotsContainer = document.querySelector('.slider-dots');
        dotsContainer.innerHTML = '';
        let currentSlide = 0;
        for (let i=0;i<slideCount;i++){ const dot = document.createElement('div'); dot.classList.add('dot'); dotsContainer.appendChild(dot); }
        const dots = document.querySelectorAll('.dot');
        function showSlide(index){ slides.style.transform = `translateX(-${index * (100 / slideCount)}%)`; dots.forEach(d => d.classList.remove('active')); if (dots[index]) dots[index].classList.add('active'); }
        showSlide(0);
        setInterval(()=>{ currentSlide = (currentSlide+1)%slideCount; showSlide(currentSlide); }, 3000);
    };

    ns.init = function(){ ns.wireEvents(); ns.initSlider(); };
})(window.RegisterApp);

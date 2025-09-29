// UI management, event wiring, and slider initialization
window.LoginApp = window.LoginApp || {};
(function(ns){
    // Cache DOM
    ns.h2Title = ns.q('.card h2');
    ns.loginButton = ns.q('#loginButton');
    ns.globalErrorMessage = ns.q('#error-message');
    ns.usernameContainer = ns.q('#username-container');
    ns.passwordContainer = ns.q('#password-container');
    ns.otpContainer = ns.q('#otp-container');
    ns.forgotEmailGroup = ns.q('#forgot-password-email-group');
    ns.resetPasswordGroup = ns.q('#reset-password-group');
    ns.optionsContainer = ns.q('.options-container');
    ns.registerLink = ns.q('.register-link');
    ns.backToLoginContainer = ns.q('#back-to-login-container');
    ns.backToLoginLink = ns.q('#backToLoginLink');
    ns.usernameInput = ns.q('#username');
    ns.passwordInput = ns.q('#password');
    ns.otpInput = ns.q('#otp');
    ns.forgotEmailInput = ns.q('#forgot-email');
    ns.newPasswordInput = ns.q('#new-password');
    ns.confirmNewPasswordInput = ns.q('#confirm-new-password');
    ns.forgotPasswordLink = ns.q('#forgotPasswordLink');
    ns.form = ns.q('#loginForm');

    // State
    ns.stage = 'login';
    ns.currentUserData = null;
    ns.currentUserKey = null;

    // Loading helper
    ns.setLoading = (isLoading, text) => { ns.loginButton.disabled = isLoading; ns.loginButton.textContent = text; };

    // Wire events
    ns.wireEvents = function(){
        ns.loginButton.addEventListener('click', () => {
            ns.globalErrorMessage.style.display = 'none';
            if (ns.stage === 'login') ns.loginWithPassword(ns.usernameInput.value.trim(), ns.passwordInput.value);
            else if (ns.stage === 'login_otp') ns.verifyLoginOtp();
            else if (ns.stage === 'forgot_email') ns.handleForgotPasswordEmail(ns.forgotEmailInput.value.trim().toLowerCase());
            else if (ns.stage === 'forgot_reset') ns.handleResetPassword(ns.otpInput.value.trim(), ns.newPasswordInput.value, ns.confirmNewPasswordInput.value);
        });

        ns.forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); ns.stage = 'forgot_email'; ns.updateUI(); });
        ns.backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); ns.stage = 'login'; ns.updateUI(); });

        ns.form.addEventListener('keydown', function(event) { if (event.key === 'Enter') { event.preventDefault(); ns.loginButton.click(); } });

        // password toggles
        function setupPasswordToggle(toggleElementId, passwordElementId){
            const toggleElement = ns.q('#'+toggleElementId);
            const passwordElement = ns.q('#'+passwordElementId);
            if (toggleElement && passwordElement){
                toggleElement.addEventListener('click', function(){
                    const type = passwordElement.getAttribute('type') === 'password' ? 'text' : 'password';
                    passwordElement.setAttribute('type', type);
                    const icon = this.querySelector('i');
                    icon.classList.toggle('fa-eye'); icon.classList.toggle('fa-eye-slash');
                });
            }
        }
        setupPasswordToggle('togglePassword', 'password');
        setupPasswordToggle('toggleNewPassword', 'new-password');
        setupPasswordToggle('toggleConfirmNewPassword', 'confirm-new-password');
    };

    // expose helpers to auth module
    ns.showError = ns.showError || function(el, msg, t){ ns.showError(el, msg, t); };

    ns.updateUI = function(){
        [ns.usernameContainer, ns.passwordContainer, ns.optionsContainer, ns.otpContainer, ns.forgotEmailGroup, ns.resetPasswordGroup, ns.registerLink, ns.backToLoginContainer].forEach(el => { if (el) el.style.display = 'none'; });
        ns.globalErrorMessage.style.display = 'none';
        if (ns.stage === 'login'){
            ns.h2Title.textContent = 'Administrasi';
            [ns.usernameContainer, ns.passwordContainer, ns.optionsContainer, ns.registerLink].forEach(el => { if (el) el.style.display = 'block'; });
            ns.setLoading(false, 'Login');
        } else if (ns.stage === 'forgot_email'){
            ns.h2Title.textContent = 'Lupa Password';
            if (ns.forgotEmailGroup) ns.forgotEmailGroup.style.display = 'block';
            if (ns.backToLoginContainer) ns.backToLoginContainer.style.display = 'block';
            ns.setLoading(false, 'Kirim OTP');
        } else if (ns.stage === 'forgot_reset'){
            ns.h2Title.textContent = 'Reset Password Anda';
            if (ns.otpContainer) ns.otpContainer.style.display = 'block';
            if (ns.resetPasswordGroup) ns.resetPasswordGroup.style.display = 'block';
            if (ns.backToLoginContainer) ns.backToLoginContainer.style.display = 'block';
            ns.setLoading(false, 'Reset Password');
            if (ns.otpInput) ns.otpInput.focus();
        } else if (ns.stage === 'login_otp'){
            ns.h2Title.textContent = 'Verifikasi Login';
            if (ns.otpContainer) ns.otpContainer.style.display = 'block';
            if (ns.backToLoginContainer) ns.backToLoginContainer.style.display = 'block';
            ns.setLoading(false, 'Verifikasi OTP');
            if (ns.otpInput) ns.otpInput.focus();
        }
    };

    // Slider (kept local to UI for responsiveness)
    ns.initSlider = function(){
        const slides = document.querySelector('.slides');
        if (!slides) return;
        const slideCount = document.querySelectorAll('.slide').length || 1;
        const dotsContainer = document.querySelector('.slider-dots');
        let currentSlide = 0;
        dotsContainer.innerHTML = '';
        for (let i=0;i<slideCount;i++){ const dot = document.createElement('div'); dot.classList.add('dot'); dotsContainer.appendChild(dot); }
        const dots = document.querySelectorAll('.dot');
        function showSlide(index){ slides.style.transform = `translateX(-${index * (100 / slideCount)}%)`; dots.forEach(d => d.classList.remove('active')); if (dots[index]) dots[index].classList.add('active'); }
        showSlide(0);
        setInterval(()=>{ currentSlide = (currentSlide+1)%slideCount; showSlide(currentSlide); }, 3000);
    };

    // Init entrypoint
    ns.init = function(){
        // redirect if already logged in
        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'monitor.html';
            return;
        }
        ns.wireEvents();
        ns.initSlider();
        ns.updateUI();
    };
})(window.LoginApp);

// Utility helpers for login flows
window.LoginApp = window.LoginApp || {};
(function(ns){
    // DOM helpers
    ns.q = (sel, ctx=document) => ctx.querySelector(sel);
    ns.qAll = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

    // Input error helpers
    ns.setInputError = (input, message) => {
        const c = input.parentElement;
        c.classList.add('error');
        const t = c.querySelector('.error-text');
        if (t) { t.innerText = message; t.style.display = 'block'; }
    };
    ns.clearInputError = (input) => {
        const c = input.parentElement;
        c.classList.remove('error');
        const t = c.querySelector('.error-text');
        if (t) t.style.display = 'none';
    };

    // Simple UI notification
    ns.showError = (el, message, type='error') => {
        el.textContent = message;
        el.style.borderColor = type === 'success' ? 'rgba(76, 175, 80, 0.5)' : 'rgba(211, 47, 47, 0.5)';
        el.style.backgroundColor = type === 'success' ? 'rgba(76, 175, 80, 0.2)' : 'rgba(211, 47, 47, 0.2)';
        el.style.color = type === 'success' ? '#c8e6c9' : '#ffcdd2';
        el.style.display = 'block';
    };

    // Password hashing helpers
    const str2ab = (str) => new Uint8Array(str.split('').map(c => c.charCodeAt(0))).buffer;
    const ab2hex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    ns.hashPassword = async (password, salt) => {
        const hB = await crypto.subtle.digest('SHA-256', str2ab(password + salt));
        return ab2hex(hB);
    };
})(window.LoginApp);

window.RegisterApp = window.RegisterApp || {};
(function(ns){
    ns.q = (sel, ctx=document) => ctx.querySelector(sel);
    ns.qAll = (sel, ctx=document) => Array.from(ctx.querySelectorAll(sel));

    ns.setInputError = (input, message) => { const c = input.parentElement; c.classList.add('error'); const t = c.querySelector('.error-text'); if (t){ t.innerText = message; t.style.display = 'block'; } };
    ns.clearInputError = (input) => { const c = input.parentElement; c.classList.remove('error'); const t = c.querySelector('.error-text'); if (t) t.style.display = 'none'; };
    ns.showError = (el, message, type='error') => { el.textContent = message; el.style.display = 'block'; el.style.backgroundColor = type === 'error' ? 'rgba(211,47,47,0.2)' : 'rgba(56,142,60,0.15)'; };

    const str2ab = (str) => new Uint8Array(str.split('').map(c => c.charCodeAt(0))).buffer;
    const ab2hex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    ns.hashPassword = async (password, salt) => { const hB = await crypto.subtle.digest('SHA-256', str2ab(password + salt)); return ab2hex(hB); };
})(window.RegisterApp);

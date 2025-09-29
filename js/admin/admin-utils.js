window.AdminApp = window.AdminApp || {};
(function(ns){
    ns.q = (sel, ctx=document) => ctx.querySelector(sel);
    ns.qAll = (sel, ctx=document) => Array.from((ctx || document).querySelectorAll(sel));

    const str2ab = (str) => new Uint8Array(str.split('').map(c => c.charCodeAt(0))).buffer;
    const ab2hex = (buffer) => Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2,'0')).join('');
    ns.hashPassword = async (password, salt) => { const hB = await crypto.subtle.digest('SHA-256', str2ab(password + salt)); return ab2hex(hB); };
})(window.AdminApp);

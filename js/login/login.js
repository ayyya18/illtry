// Bootstrapper for modular login code
document.addEventListener('DOMContentLoaded', function(){
    // Ensure our modules are available and then init
    if (window.LoginApp && typeof window.LoginApp.init === 'function'){
        window.LoginApp.init();
    } else {
        console.error('LoginApp modules not loaded correctly.');
    }
});
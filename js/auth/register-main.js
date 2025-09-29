document.addEventListener('DOMContentLoaded', function(){
    if (window.RegisterApp && typeof window.RegisterApp.init === 'function'){
        window.RegisterApp.init();
    } else {
        console.error('RegisterApp modules not loaded correctly.');
    }
});

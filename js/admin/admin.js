// Bootstrap admin modules
document.addEventListener('DOMContentLoaded', function(){
    if (window.AdminApp && typeof window.AdminApp.init === 'function'){
        window.AdminApp.init();
    } else {
        console.error('Admin modules not loaded correctly. Make sure admin-firebase.js, admin-utils.js, admin-data.js, and admin-ui.js are included before this script.');
    }
});
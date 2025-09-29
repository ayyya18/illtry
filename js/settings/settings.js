// Bootstrap settings modules
document.addEventListener('DOMContentLoaded', function(){
    if (window.SettingsApp && typeof window.SettingsApp.init === 'function'){
        window.SettingsApp.init();
    } else {
        console.error('Settings modules not loaded correctly. Ensure settings-firebase.js, settings-utils.js, settings-data.js, and settings-ui.js are included before this file.');
    }
});
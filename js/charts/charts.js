// Bootstrap for modular charts
document.addEventListener('DOMContentLoaded', function(){
    if (window.ChartApp && typeof window.ChartApp.init === 'function'){
        window.ChartApp.init();
    } else {
        console.error('Chart modules not loaded correctly. Ensure charts-config.js, charts-utils.js, charts-data.js, and charts-ui.js are included before this file.');
    }
});
// Bootstrapper: wire UI and init slider on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    const App = window.App = window.App || {};
    // wire UI event handlers
    App.ui && App.ui.wireUI && App.ui.wireUI();
    // init slider
    const sliderInstance = App.slider && App.slider.initTempSlider && App.slider.initTempSlider();
    // export small helper for others
    window._sliderInstance = sliderInstance;
});

// Firebase configuration and initialization (safe single-init)
window.RegisterApp = window.RegisterApp || {};
(function(ns){
    const firebaseConfig = {
        apiKey: "AIzaSyBocEu3xpflgxTLfGu7KpqKl9CKq56nQTs",
        authDomain: "illtry-1b834.firebaseapp.com",
        databaseURL: "https://illtry-1b834-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "illtry-1b834",
        storageBucket: "illtry-1b834.appspot.com",
        messagingSenderId: "392211014938",
        appId: "1:392211014938:web:17e5f6ae3db13ccdd638a3",
        measurementId: "G-2SWV2QKWN5"
    };

    // Initialize Firebase only once. Uses compat build loaded from CDN.
    try {
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
    } catch (e) {
        // If something unexpected happens, log and continue — other modules will surface errors.
        console.error('Firebase init error:', e);
    }

    // Expose Firestore and Realtime Database under RegisterApp
    try {
        ns.db = firebase.firestore();
    } catch (e) {
        ns.db = null;
        console.error('Firestore init error:', e);
    }

    try {
        ns.database = firebase.database();
    } catch (e) {
        ns.database = null;
        console.error('Realtime Database init error:', e);
    }

    // Also expose some app-level helpers on window.App for other scripts
    window.App = window.App || {};
    window.App.database = ns.database;
    window.App.firestore = ns.db;
    window.App.openWeatherApiKey = window.App.openWeatherApiKey || '5713af0c029a6607c56bd11eea2ab6d6';
    window.App.GOOGLE_SHEET_WEB_APP_URL = window.App.GOOGLE_SHEET_WEB_APP_URL || 'https://script.google.com/macros/s/AKfycbzvvIHcWmJROgMmlom6NI8aFW9UD4WuMr7ughgTiHx4H8R2s-O9XCUTfeYBxC4RFDOWWQ/exec';
})(window.RegisterApp);

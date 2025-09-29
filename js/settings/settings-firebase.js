// Settings page Firebase initialization (safe single-init) and constants
window.SettingsApp = window.SettingsApp || {};
(function(ns){
    ns.GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzdriRvtc-uI4SBu17FaZ51LZTRqhu5nJOolNqPrtg2xESOXZP3yido6SJ1jIjLzPNg/exec";

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

    try {
        if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
    } catch (e) { console.error('Firebase init error (settings):', e); }

    try { ns.database = firebase.database(); } catch (e) { ns.database = null; console.error('Realtime DB init error (settings):', e); }
    try { ns.firestore = firebase.firestore(); } catch (e) { ns.firestore = null; }
    window.App = window.App || {};
    window.App.database = window.App.database || ns.database;
    window.App.firestore = window.App.firestore || ns.firestore;
})(window.SettingsApp);

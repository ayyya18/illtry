// Admin page Firebase initialization (safe single-init)
window.AdminApp = window.AdminApp || {};
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

    try {
        if (!firebase.apps || firebase.apps.length === 0) firebase.initializeApp(firebaseConfig);
    } catch (e) {
        console.error('Firebase init error (admin):', e);
    }

    try { ns.db = firebase.firestore(); } catch (e) { ns.db = null; console.error('Firestore init error (admin):', e); }
    try { ns.database = firebase.database(); } catch (e) { ns.database = null; console.error('Realtime DB init error (admin):', e); }
    // expose on global App for other scripts if used
    window.App = window.App || {};
    window.App.firestore = window.App.firestore || ns.db;
    window.App.database = window.App.database || ns.database;
})(window.AdminApp);

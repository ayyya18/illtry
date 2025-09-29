// Firebase initialization and shared constants
window.LoginApp = window.LoginApp || {};
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

    // Initialize Firebase (uses firebase global loaded from CDN)
    try {
        firebase.initializeApp(firebaseConfig);
    } catch (e) {
        // ignore if already initialized
    }

    ns.db = firebase.firestore();
    ns.database = firebase.database();
})(window.LoginApp);

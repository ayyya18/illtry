window.AdminApp = window.AdminApp || {};
(function(ns){
    const db = ns.db;
    ns.usersCollection = () => db ? db.collection('users') : null;

    ns.addUser = async function(userData){
        const col = ns.usersCollection(); if (!col) throw new Error('Firestore not initialized');
        return col.add(userData);
    };

    ns.updateUser = async function(key, userData){
        const col = ns.usersCollection(); if (!col) throw new Error('Firestore not initialized');
        return col.doc(key).update(userData);
    };

    ns.deleteUser = async function(key){
        const col = ns.usersCollection(); if (!col) throw new Error('Firestore not initialized');
        return col.doc(key).delete();
    };

    ns.getUser = async function(key){
        const col = ns.usersCollection(); if (!col) throw new Error('Firestore not initialized');
        const doc = await col.doc(key).get(); return doc.exists ? doc.data() : null;
    };

    ns.streamUsers = function(onSnapshot, onError){
        const col = ns.usersCollection(); if (!col) throw new Error('Firestore not initialized');
        return col.onSnapshot(onSnapshot, onError);
    };
})(window.AdminApp);

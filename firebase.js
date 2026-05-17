import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCCgUDZYAN6jNlN5TWNQN6LChz7u5fLD6Q",
    authDomain: "smartsystem-64411.firebaseapp.com",
    projectId: "smartsystem-64411",
    storageBucket: "smartsystem-64411.firebasestorage.app",
    messagingSenderId: "588581066294",
    appId: "1:588581066294:web:1a61caf4146e8f1dbfaa97",
    measurementId: "G-RY64WR6BGN"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export {
    db,
    auth,
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updatePassword
};
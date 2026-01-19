import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyA232Ps-x7mGqNRvukSyUWlUexJD5xqSns",
    authDomain: "sultan-order.firebaseapp.com",
    projectId: "sultan-order",
    storageBucket: "sultan-order.firebasestorage.app",
    messagingSenderId: "800371771609",
    appId: "1:800371771609:web:0b19e3d359ff39cb85d6c8",
    measurementId: "G-W9E8YHR0CN"
};

// Initialize Firebase (Singleton pattern to avoid re-initialization)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

// Analytics only runs in browser environment
let analytics;
if (typeof window !== "undefined") {
    isSupported().then(yes => yes && (analytics = getAnalytics(app)));
}

export { app, db, analytics };

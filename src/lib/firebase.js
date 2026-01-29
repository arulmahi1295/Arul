// Real Firebase Implementation
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAlnOtT83q2nkO6TI-uREQsITTdC-gJR0I",
    authDomain: "greenhealth-lis.firebaseapp.com",
    projectId: "greenhealth-lis",
    storageBucket: "greenhealth-lis.firebasestorage.app",
    messagingSenderId: "480606129452",
    appId: "1:480606129452:web:f5bf7aacb0424e1532f089",
    measurementId: "G-E0D3GMG3SQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;
// Only initialize analytics in browser environment
if (typeof window !== 'undefined') {
    analytics = getAnalytics(app);
}
const db = getFirestore(app);

// Auth Initialization
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
    db,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    updateDoc,
    deleteDoc,
    auth,
    googleProvider
};

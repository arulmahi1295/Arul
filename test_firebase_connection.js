
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

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
const db = getFirestore(app);
const COLLECTIONS = { PATIENTS: 'patients' };

async function testConnection() {
    console.log("Starting Firebase Connection Test (Standalone)...");
    try {
        console.log("1. Testing connection by fetching patients...");
        const snapshot = await getDocs(collection(db, COLLECTIONS.PATIENTS));
        console.log(`- Success! Retrieved ${snapshot.docs.length} patients.`);

        console.log("2. Testing savePatient() with dummy data...");
        const dummyPatient = {
            fullName: "Test Patient " + Date.now(),
            age: "30",
            gender: "Male",
            phone: "1234567890",
            email: "test@example.com",
            address: "Test Address",
            createdAt: new Date().toISOString(),
            id: `TEST-${Date.now()}`
        };

        try {
            const docRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), dummyPatient);
            console.log(`- Success! Saved patient with Firestore ID: ${docRef.id}`);
        } catch (saveError) {
            console.error("- FAILED to save patient:", saveError);
        }

    } catch (error) {
        console.error("Test FAILED with error:", error);
    }
    // We need to exit explicitly because Firebase connection keeps verifying
    process.exit(0);
}

testConnection();

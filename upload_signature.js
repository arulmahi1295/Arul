import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
    apiKey: "AIzaSyAlnOtT83q2nkO6TI-uREQsITTdC-gJR0I",
    authDomain: "greenhealth-lis.firebaseapp.com",
    projectId: "greenhealth-lis",
    storageBucket: "greenhealth-lis.firebasestorage.app",
    messagingSenderId: "480606129452",
    appId: "1:480606129452:web:f5bf7aacb0424e1532f089"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const imagePath = "C:/Users/vimal/.gemini/antigravity/brain/ed5da3ec-60ab-4b92-b9e7-ff5038cd1f7b/uploaded_image_1767787889388.png";

const uploadSignature = async () => {
    try {
        console.log("Checking file...");
        const stats = fs.statSync(imagePath);
        const fileSizeInBytes = stats.size;
        const maxSizeInBytes = 500 * 1024; // 500KB

        console.log(`File size: ${(fileSizeInBytes / 1024).toFixed(2)} KB`);

        if (fileSizeInBytes > maxSizeInBytes) {
            console.error("Error: File is too large. Max 500KB allowed.");
            process.exit(1);
        }

        console.log("Converting to Base64...");
        const bitmap = fs.readFileSync(imagePath);
        const base64Image = `data:image/png;base64,${bitmap.toString('base64')}`;

        console.log("Uploading to Firestore...");
        const settingsCol = collection(db, 'settings');
        const snap = await getDocs(settingsCol);

        if (snap.empty) {
            await addDoc(settingsCol, { signature: base64Image });
            console.log("Created new settings document with signature.");
        } else {
            await updateDoc(snap.docs[0].ref, { signature: base64Image });
            console.log("Updated existing settings document with signature.");
        }
        console.log("Success! Signature uploaded.");
        process.exit(0);
    } catch (error) {
        console.error("Failed:", error);
        process.exit(1);
    }
};

uploadSignature();

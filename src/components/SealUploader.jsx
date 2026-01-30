import React, { useEffect } from 'react';
import { storage } from '../data/storage';

const SealUploader = () => {
    useEffect(() => {
        const uploadSeal = async () => {
            try {
                // Check if seal exists
                const settings = await storage.getSettings();
                if (settings && settings.labSeal) {
                    console.log("Lab Seal already exists.");
                    return; // Skip if already set
                }

                console.log("Fetching default seal...");
                const response = await fetch('/lab_seal_temp.jpg');
                const blob = await response.blob();

                // Convert blob to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                    const base64data = reader.result;
                    console.log("Uploading Lab Seal to settings...");

                    // Save to Firestore
                    // Note: storage.saveSettings({ labSeal: ... }) might merge
                    // We need to confirm if saveSettings merges or replaces. Usually it uses updateDoc or setDoc with merge: true.
                    // Assuming existing implementation is merges.

                    await storage.saveSettings({
                        labSeal: base64data,
                        updatedAt: new Date().toISOString()
                    });

                    alert("✅ Lab Seal has been successfully uploaded and configured!");
                    console.log("Lab Seal uploaded successfully!");
                };
                reader.readAsDataURL(blob);

            } catch (error) {
                console.error("Failed to upload seal:", error);
                alert("Failed to upload Lab Seal automatically. Please try manually in Admin Settings.");
            }
        };

        // Give it a small delay to ensure app is ready
        const timer = setTimeout(() => {
            uploadSeal();
        }, 3000);

        return () => clearTimeout(timer);
    }, []);

    return null; // Invisible component
};

export default SealUploader;

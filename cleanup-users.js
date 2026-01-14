// Cleanup Script - Remove all users except arul
// Run this in browser console while on the app

import { db } from './src/lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';

async function cleanupUsers() {
    console.log('Starting user cleanup...');

    try {
        // Get all users
        const usersSnapshot = await getDocs(collection(db, 'users'));

        console.log(`Found ${usersSnapshot.size} users`);

        // Delete all users
        for (const userDoc of usersSnapshot.docs) {
            await deleteDoc(userDoc.ref);
            console.log(`Deleted user: ${userDoc.data().username}`);
        }

        // Create the single user: arul
        const arulUser = {
            id: 'USR-001',
            username: 'arul',
            password: '1295',
            name: 'Arul Mahi',
            role: 'Admin',
            department: 'Management',
            status: 'Active',
            email: 'arul@greenhealth.lab',
            phone: '+91 98765 43210',
            joiningDate: new Date().toISOString().split('T')[0]
        };

        await setDoc(doc(db, 'users', 'USR-001'), arulUser);

        console.log('✅ Cleanup complete!');
        console.log('Created user: arul / 1295 (Admin)');

        return { success: true, message: 'User database cleaned. Only arul/1295 remains.' };
    } catch (error) {
        console.error('Error during cleanup:', error);
        return { success: false, error: error.message };
    }
}

// Run the cleanup
cleanupUsers().then(result => {
    console.log(result);
});

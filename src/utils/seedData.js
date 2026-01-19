import { db } from '../lib/firebase';
import { collection, addDoc, writeBatch, getDocs, deleteDoc, doc } from 'firebase/firestore';

// Helper to generate random dates
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

export const seedDashboardData = async () => {
    console.log("Starting seed process...");

    // 1. Seed Patients
    const patients = [];
    const patientBatch = writeBatch(db);
    for (let i = 0; i < 20; i++) {
        const id = `P-${2024}-${1000 + i}`;
        const patient = {
            id,
            fullName: `Test Patient ${i + 1}`,
            age: Math.floor(Math.random() * 60) + 18,
            gender: Math.random() > 0.5 ? 'Male' : 'Female',
            phone: `9876543${100 + i}`,
            email: `patient${i}@test.com`,
            createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
        };
        patients.push(patient);
        const ref = doc(db, 'patients', id);
        patientBatch.set(ref, patient);
    }
    await patientBatch.commit();
    console.log("Patients seeded.");

    // 2. Seed Orders (Orders need valid patient IDs)
    const orderBatch = writeBatch(db);
    for (let i = 0; i < 50; i++) {
        const randPatient = patients[Math.floor(Math.random() * patients.length)];
        const orderId = `ORD-${2024}-${5000 + i}`;
        const order = {
            id: orderId,
            patientId: randPatient.id,
            patientName: randPatient.fullName,
            tests: [
                { name: 'CBC', price: 500 },
                { name: 'Thyroid Profile', price: 800 }
            ],
            totalAmount: 1300,
            status: ['pending', 'processing', 'completed'][Math.floor(Math.random() * 3)],
            createdAt: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
        };
        const ref = doc(db, 'orders', orderId);
        orderBatch.set(ref, order);
    }
    await orderBatch.commit();
    console.log("Orders seeded.");
};

export const clearSeedData = async () => {
    console.log("Clearing demo data...");

    // Clear Patients
    const patientsSnapshot = await getDocs(collection(db, 'patients'));
    const patientBatch = writeBatch(db);
    patientsSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('P-2024')) { // Only delete demo data
            patientBatch.delete(doc.ref);
        }
    });
    await patientBatch.commit();

    // Clear Orders
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orderBatch = writeBatch(db);
    ordersSnapshot.docs.forEach(doc => {
        if (doc.id.startsWith('ORD-2024')) { // Only delete demo data
            orderBatch.delete(doc.ref);
        }
    });
    await orderBatch.commit();

    console.log("Demo data cleared.");
};

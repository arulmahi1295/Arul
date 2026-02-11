import { db } from '../lib/firebase';
import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    setDoc,
    query,
    where,
    orderBy,
    Timestamp,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot
} from 'firebase/firestore';

const COLLECTIONS = {
    PATIENTS: 'patients',
    ORDERS: 'orders',
    USERS: 'users',
    REFERRALS: 'referrals',
    OUTSOURCE_LABS: 'outsource_labs',
    HOME_COLLECTIONS: 'home_collections',
    SETTINGS: 'settings',
    INVENTORY: 'inventory',
    ACTIVITY_LOGS: 'activity_logs'
};

export const storage = {
    // Patient Methods
    getPatients: async () => {
        try {
            const q = query(collection(db, COLLECTIONS.PATIENTS), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (e) {
            console.error('Error fetching patients:', e);
            return [];
        }
    },

    savePatient: async (patientData) => {
        try {
            const newPatient = {
                ...patientData,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, COLLECTIONS.PATIENTS), newPatient);
            return { ...newPatient, firebaseId: docRef.id };
        } catch (e) {
            console.error('Error saving patient:', e);
            throw e;
        }
    },

    updatePatient: async (patientId, updates) => {
        try {
            // Find by custom ID similar to updateOrder
            const q = query(collection(db, COLLECTIONS.PATIENTS), where('id', '==', patientId));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const docRef = snapshot.docs[0].ref;
            await updateDoc(docRef, updates);
            return { ...snapshot.docs[0].data(), ...updates };
        } catch (e) {
            console.error('Error updating patient:', e);
            throw e;
        }
    },

    getNextPatientId: async () => {
        // Simple client-side generation for now to avoid complex counters
        // Ideal: Use a counter document in a transaction
        // Fallback: P-Year-Random
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000);
        return `P-${year}-${String(random).padStart(4, '0')}`;
    },

    searchPatients: async (queryText) => {
        if (!queryText) return [];
        // Firestore search is limited. We'll fetch all or implement specific field search
        // For small datasets, client-side filtering after fetch is easier, but let's try 'where'
        // 'where' only works for exact matches or range.
        // Let's rely on client-side filtering for search for now to keep it flexible
        const patients = await storage.getPatients();
        const lowerQuery = queryText.toLowerCase();
        return patients.filter(p =>
            p.fullName.toLowerCase().includes(lowerQuery) ||
            (p.id && p.id.toLowerCase().includes(lowerQuery)) ||
            (p.phone && p.phone.includes(queryText))
        );
    },

    // Order Methods
    getOrders: async () => {
        try {
            const q = query(collection(db, COLLECTIONS.ORDERS), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (e) {
            console.error('Error fetching orders:', e);
            return [];
        }
    },

    getOrdersByDateRange: async (from, to) => {
        try {
            // Assume from/to are YYYY-MM-DD strings
            const q = query(
                collection(db, COLLECTIONS.ORDERS),
                where('createdAt', '>=', from),
                where('createdAt', '<=', to + 'T23:59:59')
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (e) {
            console.error('Error fetching orders by date:', e);
            return [];
        }
    },

    saveOrder: async (orderData) => {
        try {
            const year = new Date().getFullYear();
            const random = Math.floor(Math.random() * 10000);
            const orderId = `ORD-${year}-${String(random).padStart(4, '0')}`;

            const newOrder = {
                ...orderData,
                id: orderId,
                createdAt: new Date().toISOString(),
                status: 'pending'
            };
            const docRef = await addDoc(collection(db, COLLECTIONS.ORDERS), newOrder);
            return { ...newOrder, firebaseId: docRef.id };
        } catch (e) {
            console.error('Error saving order:', e);
            throw e;
        }
    },

    updateOrder: async (orderId, updates) => {
        try {
            // We need the document ID (firebaseId), not our custom ID
            // This is tricky if we don't store firebaseId. 
            // We should query by our custom 'id' first to find the doc.
            const q = query(collection(db, COLLECTIONS.ORDERS), where('id', '==', orderId));
            const snapshot = await getDocs(q);
            if (snapshot.empty) return null;

            const docRef = snapshot.docs[0].ref;
            await updateDoc(docRef, updates);
            return { ...snapshot.docs[0].data(), ...updates };
        } catch (e) {
            console.error('Error updating order:', e);
            return null;
        }
    },

    // User Methods
    getUsers: async () => {
        try {
            const snapshot = await getDocs(collection(db, COLLECTIONS.USERS));
            let users = snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));

            if (users.length === 0) {
                // If empty, return default admin mock, BUT DON'T SAVE IT yet to avoid auto-creating
                return [{
                    id: 'U-001',
                    name: 'Admin',
                    username: 'admin',
                    password: 'pass123',
                    role: 'Admin',
                    department: 'Management'
                }];
            }
            return users;
        } catch (e) {
            console.error('Error fetching users:', e);
            return [{
                id: 'U-001',
                name: 'Admin',
                username: 'admin',
                password: 'pass123',
                role: 'Admin',
                department: 'Management'
            }];
        }
    },

    saveUser: async (userData) => {
        try {
            const newUser = {
                status: 'Active',
                earnings: 0,
                firstName: userData.name.split(' ')[0],
                ...userData,
                id: `U-${Date.now().toString().slice(-4)}`,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, COLLECTIONS.USERS), newUser);
            return { ...newUser, firebaseId: docRef.id };
        } catch (e) {
            console.error('Error saving user:', e);
            throw e;
        }
    },

    updateUser: async (id, updates) => {
        const q = query(collection(db, COLLECTIONS.USERS), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await updateDoc(snap.docs[0].ref, updates);
            return { ...snap.docs[0].data(), ...updates };
        }
    },

    deleteUser: async (id) => {
        const q = query(collection(db, COLLECTIONS.USERS), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await deleteDoc(snap.docs[0].ref);
        }
    },

    // Outsource Lab Methods
    getOutsourceLabs: async () => {
        try {
            const snap = await getDocs(collection(db, COLLECTIONS.OUTSOURCE_LABS));
            if (snap.empty) {
                const defaults = [
                    { name: 'Lal PathLabs', type: 'Reference' },
                    { name: 'Metropolis', type: 'Reference' },
                    { name: 'Thyrocare', type: 'Reference' },
                    { name: 'Redcliffe', type: 'Reference' },
                    { name: 'Max Lab', type: 'Reference' },
                    { name: 'Local Hospital Reference', type: 'Hospital' }
                ];
                const saved = [];
                for (const d of defaults) {
                    const newItem = { ...d, id: `LAB-${Math.floor(Math.random() * 10000)}`, createdAt: new Date().toISOString() };
                    await addDoc(collection(db, COLLECTIONS.OUTSOURCE_LABS), newItem);
                    saved.push(newItem);
                }
                return saved;
            }
            return snap.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
        } catch (e) { console.error(e); return []; }
    },

    saveOutsourceLab: async (labData) => {
        const newItem = {
            ...labData,
            id: `LAB-${Date.now()}`,
            createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, COLLECTIONS.OUTSOURCE_LABS), newItem);
        return newItem;
    },

    deleteOutsourceLab: async (id) => {
        const q = query(collection(db, COLLECTIONS.OUTSOURCE_LABS), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await deleteDoc(snap.docs[0].ref);
        }
    },

    // Simplified methods for others
    getReferrals: async () => {
        const snap = await getDocs(collection(db, COLLECTIONS.REFERRALS));
        return snap.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
    },
    saveReferral: async (data) => {
        const newItem = { ...data, id: `REF-${Date.now()}` };
        await addDoc(collection(db, COLLECTIONS.REFERRALS), newItem);
        return newItem;
    },
    updateReferral: async (id, updates) => {
        const q = query(collection(db, COLLECTIONS.REFERRALS), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await updateDoc(snap.docs[0].ref, updates);
            return { ...snap.docs[0].data(), ...updates };
        }
    },
    deleteReferral: async (id) => {
        // Need to find by custom ID then delete
        const q = query(collection(db, COLLECTIONS.REFERRALS), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await deleteDoc(snap.docs[0].ref);
        }
        return []; // Return empty or fresh list?
    },

    // Referral Pricing Methods
    getReferralPrices: async (referralId) => {
        try {
            const docRef = doc(db, 'referral_pricing', referralId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data().prices || {};
            }
            return {};
        } catch (e) { console.error("Error getting referral prices:", e); return {}; }
    },

    saveReferralPrices: async (referralId, prices) => {
        try {
            const docRef = doc(db, 'referral_pricing', referralId);
            await setDoc(docRef, { prices }, { merge: true });
        } catch (e) {
            console.error("Error saving referral prices:", e);
            throw e;
        }
    },

    getHomeCollections: async () => {
        const snap = await getDocs(collection(db, COLLECTIONS.HOME_COLLECTIONS));
        return snap.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
    },
    saveHomeCollection: async (data) => {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 1000);
        const id = `HC-${year}-${String(random).padStart(3, '0')}`;
        const newItem = { ...data, id, status: 'Scheduled', createdAt: new Date().toISOString() };
        await addDoc(collection(db, COLLECTIONS.HOME_COLLECTIONS), newItem);
        return newItem;
    },

    updateHomeCollection: async (id, updates) => {
        const q = query(collection(db, COLLECTIONS.HOME_COLLECTIONS), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const docRef = snap.docs[0].ref;
            await updateDoc(docRef, updates);
            return { ...snap.docs[0].data(), ...updates };
        }
    },

    // Settings
    getSettings: async () => {
        const snap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
        if (snap.empty) return {};
        return snap.docs[0].data();
    },
    saveSettings: async (settings) => {
        const snap = await getDocs(collection(db, COLLECTIONS.SETTINGS));
        if (snap.empty) {
            await addDoc(collection(db, COLLECTIONS.SETTINGS), settings);
        } else {
            await updateDoc(snap.docs[0].ref, settings);
        }
        return settings;
    },

    // Inventory Methods
    getInventory: async () => {
        const snap = await getDocs(collection(db, COLLECTIONS.INVENTORY));
        return snap.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
    },
    // Real-time subscription
    subscribeToInventory: (callback) => {
        const q = query(collection(db, COLLECTIONS.INVENTORY));
        return onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(d => ({ ...d.data(), firebaseId: d.id }));
            callback(items);
        });
    },
    saveInventoryItem: async (item) => {
        const newItem = {
            ...item,
            lastUpdated: new Date().toISOString()
        };
        // If no ID provided, generate one
        if (!newItem.id) {
            const random = Math.floor(Math.random() * 10000);
            newItem.id = `INV-${String(random).padStart(4, '0')}`;
        }

        await addDoc(collection(db, COLLECTIONS.INVENTORY), newItem);
        return newItem;
    },
    updateInventoryItem: async (id, updates) => {
        const q = query(collection(db, COLLECTIONS.INVENTORY), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const docRef = snap.docs[0].ref;
            const updatedData = { ...updates, lastUpdated: new Date().toISOString() };
            await updateDoc(docRef, updatedData);
            return { ...snap.docs[0].data(), ...updatedData };
        }
        return null;
    },
    deleteInventoryItem: async (id) => {
        const q = query(collection(db, COLLECTIONS.INVENTORY), where('id', '==', id));
        const snap = await getDocs(q);
        if (!snap.empty) {
            await deleteDoc(snap.docs[0].ref);
        }
    },

    saveTestPricing: async (testId, pricingData) => {
        try {
            await setDoc(doc(db, COLLECTIONS.TEST_PRICING, testId), pricingData, { merge: true });
        } catch (e) {
            console.error("Error saving test pricing:", e);
        }
    },

    // --- PACKAGES ---
    getPackages: async () => {
        try {
            const snapshot = await getDocs(collection(db, 'packages'));
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error("Error getting packages:", error);
            return [];
        }
    },

    savePackage: async (pkgData) => {
        try {
            // pkgData should have id (PKG-xxx), name, price, tests (array), description
            await setDoc(doc(db, 'packages', pkgData.id), pkgData, { merge: true });
            return pkgData.id;
        } catch (error) {
            console.error("Error saving package:", error);
            throw error;
        }
    },

    deletePackage: async (pkgId) => {
        try {
            await deleteDoc(doc(db, 'packages', pkgId));
        } catch (error) {
            console.error("Error deleting package:", error);
            throw error;
        }
    },

    // --- PENDING ORDERS ---
    // Activity Logs Methods
    saveActivityLog: async (logEntry) => {
        try {
            await addDoc(collection(db, COLLECTIONS.ACTIVITY_LOGS), logEntry);
        } catch (e) {
            console.error('Error saving activity log:', e);
            // Don't throw - logging failures shouldn't break the app
        }
    },

    getActivityLogs: async (filters = {}) => {
        try {
            let q = collection(db, COLLECTIONS.ACTIVITY_LOGS);

            // Apply filters
            const constraints = [];

            if (filters.userId) {
                constraints.push(where('userId', '==', filters.userId));
            }

            if (filters.action) {
                constraints.push(where('action', '==', filters.action));
            }

            if (filters.module) {
                constraints.push(where('module', '==', filters.module));
            }

            if (filters.severity) {
                constraints.push(where('severity', '==', filters.severity));
            }

            if (filters.startDate) {
                constraints.push(where('timestamp', '>=', filters.startDate));
            }

            if (filters.endDate) {
                constraints.push(where('timestamp', '<=', filters.endDate));
            }

            // Add ordering
            constraints.push(orderBy('timestamp', 'desc'));

            if (constraints.length > 0) {
                q = query(q, ...constraints);
            }

            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
        } catch (e) {
            console.error('Error fetching activity logs:', e);
            return [];
        }
    },

    // Get recent activity logs (last N entries)
    getRecentActivityLogs: async (limit = 100) => {
        try {
            const q = query(
                collection(db, COLLECTIONS.ACTIVITY_LOGS),
                orderBy('timestamp', 'desc')
            );
            const snapshot = await getDocs(q);
            const logs = snapshot.docs.map(doc => ({ ...doc.data(), firebaseId: doc.id }));
            return logs.slice(0, limit);
        } catch (e) {
            console.error('Error fetching recent activity logs:', e);
            return [];
        }
    }
};

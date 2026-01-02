
const STORAGE_KEYS = {
    PATIENTS: 'lis_patients',
    ORDERS: 'lis_orders',
    COUNTERS: 'lis_counters',
    USERS: 'lis_users',
    REFERRALS: 'lis_referrals',
    HOME_COLLECTIONS: 'lis_home_collections'
};

// Helper to get data
const get = (key) => {
    try {
        const item = localStorage.getItem(key);
        const parsed = item ? JSON.parse(item) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error('Error reading from storage', e);
        return [];
    }
};

// Helper to save data
const save = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error('Error saving to storage', e);
    }
};

export const storage = {
    // Patient Methods
    getPatients: () => {
        return get(STORAGE_KEYS.PATIENTS);
    },

    savePatient: (patientData) => {
        const patients = get(STORAGE_KEYS.PATIENTS);
        const newPatient = {
            ...patientData,
            createdAt: new Date().toISOString()
        };
        patients.push(newPatient);
        save(STORAGE_KEYS.PATIENTS, patients);
        return newPatient;
    },

    getNextPatientId: () => {
        let counters = {};
        try {
            const item = localStorage.getItem(STORAGE_KEYS.COUNTERS);
            counters = item ? JSON.parse(item) : { patient: 0, order: 0 };
            // Handle case where it might have been saved as array previously due to bug
            if (Array.isArray(counters)) counters = { patient: 0, order: 0 };
        } catch (e) {
            counters = { patient: 0, order: 0 };
        }

        counters.patient = (counters.patient || 0) + 1;

        localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));

        // Format: P-2024-001
        const year = new Date().getFullYear();
        return `P-${year}-${String(counters.patient).padStart(3, '0')}`;
    },

    searchPatients: (query) => {
        if (!query) return [];
        const patients = get(STORAGE_KEYS.PATIENTS);
        const lowerQuery = query.toLowerCase();
        return patients.filter(p =>
            p.fullName.toLowerCase().includes(lowerQuery) ||
            p.id.toLowerCase().includes(lowerQuery) ||
            p.phone.includes(query)
        );
    },

    // Order Methods
    getOrders: () => {
        return get(STORAGE_KEYS.ORDERS);
    },

    saveOrder: (orderData) => {
        const orders = get(STORAGE_KEYS.ORDERS);

        let counters = {};
        try {
            const item = localStorage.getItem(STORAGE_KEYS.COUNTERS);
            counters = item ? JSON.parse(item) : { patient: 0, order: 0 };
            if (Array.isArray(counters)) counters = { patient: 0, order: 0 };
        } catch (e) {
            counters = { patient: 0, order: 0 };
        }

        counters.order = (counters.order || 0) + 1;
        localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));

        const year = new Date().getFullYear();
        let orderId = `ORD-${year}-${String(counters.order).padStart(3, '0')}`;

        // Ensure Uniqueness (Double check against existing orders)
        while (orders.some(o => o.id === orderId)) {
            counters.order = (counters.order || 0) + 1;
            orderId = `ORD-${year}-${String(counters.order).padStart(3, '0')}`;
        }
        localStorage.setItem(STORAGE_KEYS.COUNTERS, JSON.stringify(counters));

        const newOrder = {
            ...orderData,
            id: orderId,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        orders.push(newOrder);
        save(STORAGE_KEYS.ORDERS, orders);
        return newOrder;
    },

    updateOrder: (orderId, updates) => {
        const orders = get(STORAGE_KEYS.ORDERS);
        const index = orders.findIndex(o => o.id === orderId);
        if (index !== -1) {
            orders[index] = { ...orders[index], ...updates };
            save(STORAGE_KEYS.ORDERS, orders);
            return orders[index];
        }
        return null;
    },

    // User Methods
    getUsers: () => {
        const users = get(STORAGE_KEYS.USERS);
        if (users.length === 0) {
            // Default Admin if no users exist
            return [{
                id: 'U-001',
                name: 'Admin',
                username: 'admin',
                password: 'pass123', // Reset to pass123 as per user familiarity
                role: 'Admin',
                department: 'Management'
            }];
        }
        return users;
    },

    saveUser: (userData) => {
        const users = get(STORAGE_KEYS.USERS);
        // If it was empty (and thus returning default admin mock above), we need to actually init it with admin + new user?
        // Or just start fresh? Let's ensure default admin is persisted if array is empty.
        if (users.length === 0) {
            users.push({
                id: 'U-001',
                name: 'Admin',
                username: 'admin',
                password: 'pass123',
                role: 'Admin',
                department: 'Management',
                status: 'Active',
                joiningDate: new Date().toISOString()
            });
        }

        const newUser = {
            status: 'Active', // Default status
            earnings: 0, // Track specific earnings if needed later
            firstName: userData.name.split(' ')[0], // Helper for greetings
            ...userData,
            id: `U-${Date.now().toString().slice(-4)}`,
            createdAt: new Date().toISOString()
        };
        users.push(newUser);
        save(STORAGE_KEYS.USERS, users);
        return newUser;
    },

    updateUser: (userId, updates) => {
        const users = get(STORAGE_KEYS.USERS);
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...updates };
            save(STORAGE_KEYS.USERS, users);
            return users[index];
        }
        return null;
    },

    deleteUser: (userId) => {
        const users = get(STORAGE_KEYS.USERS);
        // Prevent deleting the last admin/default admin?
        // For now allow deletion but maybe block 'admin' username in UI
        const filtered = users.filter(u => u.id !== userId);
        save(STORAGE_KEYS.USERS, filtered);
        return filtered;
    },

    // Referral Methods
    getReferrals: () => get(STORAGE_KEYS.REFERRALS),
    saveReferral: (data) => {
        const list = get(STORAGE_KEYS.REFERRALS);
        const newItem = { ...data, id: `REF-${Date.now()}` };
        list.push(newItem);
        save(STORAGE_KEYS.REFERRALS, list);
        return newItem;
    },
    deleteReferral: (id) => {
        const list = get(STORAGE_KEYS.REFERRALS);
        const filtered = list.filter(i => i.id !== id);
        save(STORAGE_KEYS.REFERRALS, filtered);
        return filtered;
    },

    // Home Collection Methods
    getHomeCollections: () => get(STORAGE_KEYS.HOME_COLLECTIONS),
    saveHomeCollection: (data) => {
        const list = get(STORAGE_KEYS.HOME_COLLECTIONS);
        // Generate a simple ID like HC-2025-001
        const year = new Date().getFullYear();
        const count = list.length + 1;
        const id = `HC-${year}-${String(count).padStart(3, '0')}`;

        const newItem = {
            ...data,
            id,
            status: 'Scheduled',
            createdAt: new Date().toISOString()
        };
        list.push(newItem);
        save(STORAGE_KEYS.HOME_COLLECTIONS, list);
        return newItem;
    },
    updateHomeCollection: (id, updates) => {
        const list = get(STORAGE_KEYS.HOME_COLLECTIONS);
        const index = list.findIndex(i => i.id === id);
        if (index !== -1) {
            list[index] = { ...list[index], ...updates };
            save(STORAGE_KEYS.HOME_COLLECTIONS, list);
            return list[index];
        }
        return null;
    },

    exportBackup: () => {
        const data = {
            patients: localStorage.getItem('lis_patients') ? JSON.parse(localStorage.getItem('lis_patients')) : [],
            orders: localStorage.getItem('lis_orders') ? JSON.parse(localStorage.getItem('lis_orders')) : [],
            users: localStorage.getItem('lis_users') ? JSON.parse(localStorage.getItem('lis_users')) : [],
            referrals: localStorage.getItem('lis_referrals') ? JSON.parse(localStorage.getItem('lis_referrals')) : [],
            homeCollections: localStorage.getItem('lis_home_collections') ? JSON.parse(localStorage.getItem('lis_home_collections')) : [],
            counters: localStorage.getItem('lis_counters') ? JSON.parse(localStorage.getItem('lis_counters')) : {},
            // Metadata
            version: '1.0',
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `lims_backup_${new Date().toISOString().slice(0, 10)}_auto.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    factoryReset: () => {
        // Explicitly remove known keys
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
        // Clear anything else
        localStorage.clear();
        return true;
    }
};

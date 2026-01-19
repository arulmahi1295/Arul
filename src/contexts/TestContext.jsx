import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore';
import { TEST_CATALOG } from '../data/testCatalog';

const TestContext = createContext();

export const useTests = () => useContext(TestContext);

export const TestProvider = ({ children }) => {
    const [tests, setTests] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Load & Migration Logic
    useEffect(() => {
        const initializeTests = async () => {
            setLoading(true);
            try {
                // 1. Check if Firestore has tests
                const testsRef = collection(db, 'tests');
                const snapshot = await getDocs(testsRef);

                if (!snapshot.empty) {
                    // Load from Firestore
                    const loadedTests = snapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setTests(loadedTests);

                    // Load Packages
                    const pkgSnapshot = await getDocs(collection(db, 'packages'));
                    const loadedPackages = pkgSnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setPackages(loadedPackages);
                } else {
                    // 2. Migration Required: Populate Firestore from static CATALOG
                    console.log("Migrating tests to Firestore...");

                    // Fetch existing pricing overrides from 'test_pricing' collection if any
                    // (To preserve any prices user might have already edited in previous version)
                    let pricingOverrides = {};
                    try {
                        const priceSnapshot = await getDocs(collection(db, 'test_pricing'));
                        priceSnapshot.forEach(doc => {
                            pricingOverrides[doc.id] = doc.data().l2lPrice;
                        });
                    } catch (e) {
                        console.warn("Could not load legacy pricing for migration", e);
                    }

                    // Prepare Batch Writes (Firestore limits 500 ops per batch)
                    // TEST_CATALOG is > 600 items, so we need chunking.
                    const chunks = [];
                    const chunkSize = 400;
                    for (let i = 0; i < TEST_CATALOG.length; i += chunkSize) {
                        chunks.push(TEST_CATALOG.slice(i, i + chunkSize));
                    }

                    for (const chunk of chunks) {
                        const batch = writeBatch(db);
                        chunk.forEach(test => {
                            const testRef = doc(db, 'tests', test.code.replace(/\//g, '_')); // Sanitize IDs
                            // Merge static data with any legacy pricing overrides
                            const testData = {
                                ...test,
                                price: test.price, // Default MRP
                                l2lPrice: pricingOverrides[test.code] || 0, // Migrated L2L Price
                                updatedAt: new Date().toISOString()
                            };
                            // Ensure ID is string
                            testData.id = test.code;

                            batch.set(testRef, testData);
                        });
                        await batch.commit();
                    }

                    // Set state after migration
                    setTests(TEST_CATALOG.map(t => ({
                        ...t,
                        id: t.code,
                        l2lPrice: pricingOverrides[t.code] || 0
                    })));
                    console.log("Migration complete.");
                }
            } catch (err) {
                console.error("Error loading/migrating tests:", err);
                setError(err.message);
                // Fallback to static catalog if DB fails, to prevent app crash
                setTests(TEST_CATALOG);
            } finally {
                setLoading(false);
            }
        };

        initializeTests();
    }, []);

    const refreshTests = async () => {
        setLoading(true);
        try {
            const snapshot = await getDocs(collection(db, 'tests'));
            const loadedTests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTests(loadedTests);

            // Reload Packages
            const pkgSnapshot = await getDocs(collection(db, 'packages'));
            const loadedPackages = pkgSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPackages(loadedPackages);
        } catch (err) {
            console.error("Error refreshing tests:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TestContext.Provider value={{ tests, packages, loading, error, refreshTests }}>
            {children}
        </TestContext.Provider>
    );
};

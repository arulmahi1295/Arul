import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, writeBatch, onSnapshot } from 'firebase/firestore';
import { TEST_CATALOG } from '../data/testCatalog';

const TestContext = createContext();

export const useTests = () => useContext(TestContext);

export const TestProvider = ({ children }) => {
    const [tests, setTests] = useState([]);
    const [packages, setPackages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initial Load & Migration Logic + Realtime Listener
    useEffect(() => {
        let unsubscribeTests = () => { };
        let unsubscribePackages = () => { };

        const initializeTests = async () => {
            setLoading(true);
            try {
                // 1. Check if Firestore has tests (Quick check)
                const testsRef = collection(db, 'tests');
                const snapshot = await getDocs(testsRef);

                let migrationNeeded = snapshot.empty;

                if (migrationNeeded) {
                    console.log("Migrating tests to Firestore...");
                    // Migration Logic
                    // Fetch legacy pricing
                    let pricingOverrides = {};
                    try {
                        const priceSnapshot = await getDocs(collection(db, 'test_pricing'));
                        priceSnapshot.forEach(doc => {
                            pricingOverrides[doc.id] = doc.data().l2lPrice;
                        });
                    } catch (e) {
                        console.warn("Could not load legacy pricing for migration", e);
                    }

                    // Batch Writes
                    const chunks = [];
                    const chunkSize = 400;
                    for (let i = 0; i < TEST_CATALOG.length; i += chunkSize) {
                        chunks.push(TEST_CATALOG.slice(i, i + chunkSize));
                    }

                    for (const chunk of chunks) {
                        const batch = writeBatch(db);
                        chunk.forEach(test => {
                            const testRef = doc(db, 'tests', test.code.replace(/\//g, '_'));
                            const testData = {
                                ...test,
                                price: test.price,
                                l2lPrice: pricingOverrides[test.code] || 0,
                                updatedAt: new Date().toISOString()
                            };
                            testData.id = test.code;
                            batch.set(testRef, testData);
                        });
                        await batch.commit();
                    }
                    console.log("Migration complete.");
                }

                // 2. Set up Real-time Listeners
                unsubscribeTests = onSnapshot(collection(db, 'tests'), (snap) => {
                    const loadedTests = snap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setTests(loadedTests);
                }, (err) => {
                    console.error("Test stream error:", err);
                    setError(err.message);
                });

                unsubscribePackages = onSnapshot(collection(db, 'packages'), (snap) => {
                    const loadedPackages = snap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setPackages(loadedPackages);
                }, (err) => {
                    console.error("Package stream error:", err);
                });

            } catch (err) {
                console.error("Error initializing tests:", err);
                setError(err.message);
                // Fallback
                if (tests.length === 0) setTests(TEST_CATALOG);
            } finally {
                setLoading(false);
            }
        };

        initializeTests();

        return () => {
            unsubscribeTests();
            unsubscribePackages();
        };
    }, []);

    const refreshTests = async () => {
        // No-op for manual refresh since we use real-time listeners now.
        // But we can log or trigger a specific check if needed.
        console.log("Tests are synced in real-time.");
    };

    return (
        <TestContext.Provider value={{ tests, packages, loading, error, refreshTests }}>
            {children}
        </TestContext.Provider>
    );
};

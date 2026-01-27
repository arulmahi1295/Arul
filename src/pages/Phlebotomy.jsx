import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Beaker, FileText, Printer, CheckCircle, Clock, History, Download, Edit2, Package } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { storage } from '../data/storage';
import { useDebounce } from '../hooks/useDebounce';
import { useTests } from '../contexts/TestContext';
import EditPatientModal from '../components/EditPatientModal';
import { logOrder } from '../utils/activityLogger';

const Phlebotomy = () => {
    const { tests, packages } = useTests();
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [selectedTests, setSelectedTests] = useState([]);
    const [l2lPrices, setL2lPrices] = useState({});
    const [referralPrices, setReferralPrices] = useState({});

    // Patient Search State
    const [patientSearch, setPatientSearch] = useState('');
    const debouncedPatientSearch = useDebounce(patientSearch, 300);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [showPatientResults, setShowPatientResults] = useState(false);

    // Order Details State
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [advancePaid, setAdvancePaid] = useState(0);
    const [paymentRemarks, setPaymentRemarks] = useState('');
    const [discount, setDiscount] = useState(0);
    const [homeCollectionCharges, setHomeCollectionCharges] = useState(0); // New State
    const [orderStatus, setOrderStatus] = useState('new'); // new, processing, completed
    const [processingMode, setProcessingMode] = useState('In-House');

    // ... (keep existing code)



    const [outsourceLab, setOutsourceLab] = useState('');
    const [patientHistory, setPatientHistory] = useState([]);
    const [outsourcePartners, setOutsourcePartners] = useState([]);

    // Feature: Edit Existing Order
    const [editingOrder, setEditingOrder] = useState(null);
    const [lastOrder, setLastOrder] = useState(null);
    const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

    // Feature: Edit Patient
    const [showEditModal, setShowEditModal] = useState(false);
    const [fullPatientDetails, setFullPatientDetails] = useState(null);



    // TAT Calculation
    const calculateTAT = (items) => {
        if (!items || items.length === 0) return null;
        let maxHours = 12;

        const processTest = (test) => {
            const cat = test.category ? test.category.toUpperCase() : '';
            if (cat.includes('MICROBIOLOGY') || cat.includes('CULTURE')) maxHours = Math.max(maxHours, 48);
            else if (cat.includes('IMMUNOLOGY') || cat.includes('SEROLOGY') || cat.includes('MOLECULAR')) maxHours = Math.max(maxHours, 24);
            else maxHours = Math.max(maxHours, 12);
        };

        items.forEach(item => {
            if (item.type === 'package') {
                // If it's a package, check all tests inside it
                if (item.tests && Array.isArray(item.tests)) {
                    item.tests.forEach(testId => {
                        const test = tests.find(t => t.id === testId);
                        if (test) processTest(test);
                    });
                }
            } else {
                processTest(item);
            }
        });
        const reportDate = new Date();
        reportDate.setHours(reportDate.getHours() + maxHours);
        return { date: reportDate, hours: maxHours };
    };

    const tatInfo = calculateTAT(selectedTests);

    // Fetch L2L Prices
    useEffect(() => {
        const priceMap = {};
        if (tests && tests.length > 0) {
            tests.forEach(t => {
                if (t.l2lPrice) priceMap[t.code] = t.l2lPrice;
            });
        }

        // Merge with legacy collection if needed, but context is source of truth now
        const fetchLegacyPrices = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'test_pricing'));
                querySnapshot.forEach((doc) => {
                    // Only overwrite if not in main catalog (legacy support)
                    if (priceMap[doc.id] === undefined) {
                        priceMap[doc.id] = doc.data().l2lPrice;
                    }
                });
                setL2lPrices(priceMap);
            } catch (error) {
                console.error("Error fetching legacy L2L prices:", error);
                setL2lPrices(priceMap); // Set what we have
            }
        };
        fetchLegacyPrices();

        const fetchLabs = async () => {
            const labs = await storage.getOutsourceLabs();
            setOutsourcePartners(labs);
        };
        fetchLabs();
    }, [tests]);

    // Initial Load - Check for Prefill OR Edit
    useEffect(() => {
        const loadInitialData = async () => {
            if (location.state?.editOrderId) {
                // LOAD EXISTING ORDER FOR EDITING
                const orders = await storage.getOrders();
                const orderToEdit = orders.find(o => o.id === location.state.editOrderId);
                if (orderToEdit) {
                    setEditingOrder(orderToEdit);
                    setSelectedPatient({
                        name: orderToEdit.patientName,
                        id: orderToEdit.patientId
                    });
                    setPatientSearch(orderToEdit.patientName);
                    setSelectedTests(orderToEdit.tests || []);
                    setDiscount(orderToEdit.discount || 0);
                    setAdvancePaid(orderToEdit.advancePaid || 0);
                    setPaymentRemarks(orderToEdit.paymentRemarks || '');
                    setPaymentMode(orderToEdit.paymentMode || 'Cash');
                    setPaymentStatus(orderToEdit.paymentStatus || 'Paid');
                    setProcessingMode(orderToEdit.processingMode || 'In-House');
                    setOutsourceLab(orderToEdit.outsourceLab || '');

                    // Fetch full patient details for editing
                    const patients = await storage.getPatients();
                    const patient = patients.find(p => p.id === orderToEdit.patientId);
                    if (patient) setFullPatientDetails(patient);
                }
            }
            else if (location.state?.prefillPatient) {
                setSelectedPatient({
                    name: location.state.prefillPatient,
                    id: location.state.patientId
                });
                setPatientSearch(location.state.prefillPatient);
                if (location.state.paymentMode) setPaymentMode(location.state.paymentMode);
                if (location.state.homeCollectionCharges) setHomeCollectionCharges(location.state.homeCollectionCharges);

                // Fetch full  details
                const patients = await storage.getPatients();
                const patient = patients.find(p => p.id === location.state.patientId);
                if (patient) setFullPatientDetails(patient);
            }
        };
        loadInitialData();
    }, [location.state]);

    // Search Patients
    useEffect(() => {
        const performSearch = async () => {
            if (debouncedPatientSearch && !selectedPatient) {
                const results = await storage.searchPatients(debouncedPatientSearch);
                setPatientSearchResults(results);
                setShowPatientResults(true);
            } else {
                setPatientSearchResults([]);
                setShowPatientResults(false);
            }
        };
        performSearch();
    }, [debouncedPatientSearch, selectedPatient]);

    // Load History when patient selected
    useEffect(() => {
        const loadHistory = async () => {
            if (selectedPatient?.id) {
                const allOrders = await storage.getOrders();
                const history = allOrders
                    .filter(o => o.patientId === selectedPatient.id)
                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setPatientHistory(history);

                // Ensure we have full patient details if not already loaded
                if (!fullPatientDetails) {
                    const patients = await storage.getPatients();
                    const patient = patients.find(p => p.id === selectedPatient.id);
                    if (patient) setFullPatientDetails(patient);
                }
            } else {
                setPatientHistory([]);
                setFullPatientDetails(null);
            }
        };
        loadHistory();
    }, [selectedPatient]);

    const selectPatient = (patient) => {
        setSelectedPatient({ name: patient.fullName, id: patient.id });
        setFullPatientDetails(patient);
        setPatientSearch(patient.fullName);
        setPatientSearchResults([]);
        setShowPatientResults(false);
    };

    const clearPatient = () => {
        setSelectedPatient(null);
        setFullPatientDetails(null);
        setPatientSearch('');
    };

    const handlePatientUpdate = async (updatedPatient) => {
        setFullPatientDetails(updatedPatient);
        setSelectedPatient({ name: updatedPatient.fullName, id: updatedPatient.id });
        setPatientSearch(updatedPatient.fullName);

        // If we are editing an order, we should probably update the order's patientName too
        if (editingOrder) {
            console.log("Patient updated, ready to save order with new details.");
        }
    };

    const filteredItems = [
        ...tests.map(t => ({ ...t, type: 'test' })),
        ...(packages || []).map(p => ({ ...p, type: 'package', code: 'PKG' }))
    ].filter(item =>
        item.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        item.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );

    const addTest = (test) => {
        if (!selectedTests.find(t => t.id === test.id)) {
            setSelectedTests([...selectedTests, test]);
        }
    };

    const removeTest = (testId) => {
        setSelectedTests(selectedTests.filter(t => t.id !== testId));
    };

    const calculateSubtotal = () => {
        return selectedTests.reduce((acc, curr) => {
            // Packages use their own price; single tests check for referral overrides
            if (curr.type === 'package') return acc + (parseFloat(curr.price) || 0);

            const finalPrice = referralPrices[curr.code] !== undefined ? referralPrices[curr.code] : curr.price;
            return acc + (parseFloat(finalPrice) || 0);
        }, 0);
    };

    const calculateTotal = () => {
        return Math.max(0, calculateSubtotal() + homeCollectionCharges - discount);
    };

    // Smart Payment Logic: Sync Advance with Total when Paid
    useEffect(() => {
        if (paymentStatus === 'Paid') {
            setAdvancePaid(calculateTotal());
        }
    }, [selectedTests, discount, paymentStatus]);

    const handleAdvanceChange = (e) => {
        const val = Math.max(0, parseInt(e.target.value) || 0);
        setAdvancePaid(val);
        // Auto-switch to Pending if amount < total
        if (val < calculateTotal()) {
            setPaymentStatus('Pending');
        } else if (val >= calculateTotal() && val > 0) {
            setPaymentStatus('Paid');
        }
    };

    const handleCreateOrder = async () => {
        if (!selectedPatient || selectedTests.length === 0) return;
        setOrderStatus('processing');

        // Enrich tests with L2L Price and Referral Price
        // Enrich tests with L2L Price and Referral Price
        const enrichedTests = selectedTests.map(test => {
            if (test.type === 'package') {
                // Enrich Package: Resolve test IDs to full objects
                const constituentTests = (test.tests || []).map(tId => {
                    const t = tests.find(x => x.id === tId);
                    if (!t) return null;
                    return {
                        ...t,
                        l2lPrice: l2lPrices[t.code] || 0
                    };
                }).filter(Boolean);

                const pkgL2lPrice = constituentTests.reduce((sum, t) => sum + (t.l2lPrice || 0), 0);

                return {
                    ...test,
                    // Store FULL objects so reporting/results don't need to look them up later
                    tests: constituentTests,
                    l2lPrice: pkgL2lPrice,
                    originalPrice: test.price,
                };
            } else {
                // Enrich Single Test
                const finalPrice = referralPrices[test.code] !== undefined ? referralPrices[test.code] : test.price;
                return {
                    ...test,
                    price: finalPrice, // Save the actual charged price
                    originalPrice: test.price, // Keep track of base MRP
                    l2lPrice: l2lPrices[test.code] !== undefined ? l2lPrices[test.code] : (test.l2lPrice || 0)
                };
            }
        });

        const orderData = {
            id: editingOrder ? editingOrder.id : `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            patientId: selectedPatient.id,
            patientName: selectedPatient.name, // Uses updated name
            tests: enrichedTests, // Use enriched tests
            subtotal: calculateSubtotal(),
            homeCollectionCharges: homeCollectionCharges,
            discount: discount,
            totalAmount: calculateTotal(),
            advancePaid: advancePaid,
            balanceDue: calculateTotal() - advancePaid,
            paymentRemarks: paymentRemarks,
            status: editingOrder ? editingOrder.status : 'pending',
            paymentMode: paymentMode,
            paymentStatus: paymentStatus,
            processingMode: processingMode,
            outsourceLab: processingMode === 'Outsource' ? outsourceLab : null,
            createdAt: editingOrder ? editingOrder.createdAt : new Date().toISOString()
        };

        if (editingOrder) {
            await storage.updateOrder(orderData.id, orderData);
            // Log order update
            await logOrder.updated(orderData.id, { tests: enrichedTests.length, amount: calculateTotal() });
        } else {
            await storage.saveOrder(orderData);
            // Log order creation
            await logOrder.created(orderData.id, selectedPatient.name, enrichedTests);
        }

        setLastOrder(orderData);

        // Simulate processing persistence
        setTimeout(() => {
            setOrderStatus('completed');
        }, 1000);
    };

    const handlePrintEstimate = () => {
        if (!selectedPatient || selectedTests.length === 0) return;

        // Enrich logic (Duplicate from handleCreateOrder for consistency sans DB save)
        const enrichedTests = selectedTests.map(test => {
            if (test.type === 'package') {
                const constituentTests = (test.tests || []).map(tId => {
                    const t = tests.find(x => x.id === tId);
                    if (!t) return null;
                    return { ...t, l2lPrice: l2lPrices[t.code] !== undefined ? l2lPrices[t.code] : (t.l2lPrice || 0) };
                }).filter(Boolean);
                return {
                    ...test,
                    tests: constituentTests,
                    l2lPrice: constituentTests.reduce((sum, t) => sum + (t.l2lPrice || 0), 0),
                    originalPrice: test.price,
                };
            } else {
                const finalPrice = referralPrices[test.code] !== undefined ? referralPrices[test.code] : test.price;
                return {
                    ...test,
                    price: finalPrice,
                    originalPrice: test.price,
                    l2lPrice: l2lPrices[test.code] !== undefined ? l2lPrices[test.code] : (test.l2lPrice || 0)
                };
            }
        });

        const estimateData = {
            id: `EST-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`, // Temporary ID
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            tests: enrichedTests,
            subtotal: calculateSubtotal(),
            homeCollectionCharges: homeCollectionCharges,
            discount: discount,
            totalAmount: calculateTotal(),
            isEstimate: true, // FLAG FOR PRINT VIEW
            createdAt: new Date().toISOString()
        };

        sessionStorage.setItem('print_invoice_data', JSON.stringify(estimateData));
        window.open('/print/invoice', '_blank');
    };

    const handleReset = () => {
        setSelectedTests([]);
        setSelectedPatient(null);
        setFullPatientDetails(null);
        setPatientSearch('');
        setOrderStatus('new');
        setSearchTerm('');
        setEditingOrder(null);
        setDiscount(0);
        setHomeCollectionCharges(0);
        setAdvancePaid(0);
        setPaymentRemarks('');
        setIsPaymentConfirmed(false);
        navigate('.', { replace: true, state: {} });
    };

    if (orderStatus === 'completed') {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-lg mx-auto">
                    <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">
                        {editingOrder ? 'Order Updated Successfully!' : 'Order Created Successfully!'}
                    </h2>
                    <p className="text-slate-500 mb-8">
                        Records for <span className="font-semibold text-slate-700">{selectedPatient?.name}</span> have been saved.
                    </p>
                    <div className="space-y-3">
                        <button onClick={() => window.print()} className="w-full py-3 px-4 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 flex items-center justify-center transition-colors">
                            <Printer className="mr-2 h-5 w-5" /> Print Barcode Labels
                        </button>
                        <button
                            onClick={() => {
                                if (lastOrder) {
                                    sessionStorage.setItem('print_invoice_data', JSON.stringify(lastOrder));
                                    window.open('/print/invoice', '_blank');
                                }
                            }}
                            className="w-full py-3 px-4 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 flex items-center justify-center transition-colors"
                        >
                            <FileText className="mr-2 h-5 w-5" /> Download Receipt
                        </button>
                        <button onClick={handleReset} className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                            {editingOrder ? 'Back to New Order' : 'Create New Order'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex gap-6">
            {/* Left Panel: Test Selection */}
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">{editingOrder ? 'Edit Order: Select Tests' : 'Select Tests'}</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tests by name or code..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            autoFocus
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 min-h-0">
                    {filteredItems.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Beaker className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No tests or packages found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredItems.map(item => {
                                const isSelected = selectedTests.find(t => t.id === item.id);
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => !isSelected && addTest(item)}
                                        disabled={isSelected}
                                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${isSelected
                                            ? 'bg-indigo-50 border-indigo-200 opacity-60 cursor-default'
                                            : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center gap-2">
                                                {item.type === 'package' && <Package className="h-4 w-4 text-indigo-500" />}
                                                <h3 className="font-semibold text-slate-800">{item.name}</h3>
                                            </div>
                                            <div className="flex items-center mt-1 space-x-2">
                                                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{item.code}</span>
                                                {item.type === 'package' ? (
                                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                                        {item.tests?.length || 0} Tests
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">{item.category}</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold text-slate-700 mr-3">₹{item.price}</span>
                                            {isSelected ? <CheckCircle className="h-5 w-5 text-indigo-500" /> : <Plus className="h-5 w-5 text-slate-400" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Order Summary */}
            <div className="w-96 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 bg-slate-50 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">{editingOrder ? `Editing: ${editingOrder.id}` : 'Requisition'}</h2>

                    {/* Patient Selector */}
                    <div className="relative mb-4">
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <div>
                                    <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Patient</p>
                                    <p className="font-bold text-indigo-900">{selectedPatient.name}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setShowEditModal(true)}
                                        className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors"
                                        title="Edit Patient Details"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    {!editingOrder && ( // Disable clearing patient in Edit Mode to avoid accidental swap
                                        <button onClick={clearPatient} className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search or Select Patient..."
                                    value={patientSearch}
                                    onChange={(e) => setPatientSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                                />
                                {showPatientResults && patientSearchResults.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-20 max-h-60 overflow-y-auto">
                                        {patientSearchResults.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => selectPatient(p)}
                                                className="w-full text-left p-3 hover:bg-slate-50 border-b border-slate-50 last:border-0"
                                            >
                                                <p className="font-medium text-slate-800 text-sm">{p.fullName}</p>
                                                <p className="text-xs text-slate-500">{p.phone} • {p.gender}/{p.age}</p>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Patient History Mini-View */}
                    {selectedPatient && patientHistory.length > 0 && (
                        <div className="mb-2">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                                    <History className="h-3 w-3 mr-1" /> Recent Visits
                                </h3>
                                <span className="text-xs text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full">{patientHistory.length}</span>
                            </div>
                            <div className="max-h-32 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                {patientHistory.slice(0, 3).map(order => (
                                    <div key={order.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                                        <div>
                                            <p className="font-semibold text-slate-700">{new Date(order.createdAt).toLocaleDateString()}</p>
                                            <p className="text-slate-500">{order.tests?.length || 0} Tests • ₹{order.totalAmount}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* SCROLLABLE CONTENT AREA: TEST LIST + FORM INPUTS */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0 custom-scrollbar">
                    {/* Test List */}
                    {selectedTests.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-sm">No tests selected yet.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {selectedTests.map(test => (
                                <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <div>
                                        <h4 className="font-medium text-slate-800 text-sm flex items-center gap-2">
                                            {test.type === 'package' && <Package className="h-3 w-3 text-indigo-500" />}
                                            {test.name}
                                        </h4>
                                        <span className="text-xs text-slate-500">{test.code}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <span className="font-semibold text-slate-700 text-sm mr-3">₹{test.price}</span>
                                        <button onClick={() => removeTest(test.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ORDER DETAILS INPUTS (Moved from Footer) */}
                    <div className="mt-6 pt-6 border-t border-slate-100 space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Processing Center</label>
                                <select
                                    value={processingMode}
                                    onChange={(e) => setProcessingMode(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white font-medium"
                                >
                                    <option value="In-House">In-House Lab</option>
                                    <option value="Outsource">Outsource / Tie-up</option>
                                </select>
                            </div>
                            <div className="flex-1">
                                {processingMode === 'Outsource' ? (
                                    <div className="animate-in fade-in slide-in-from-left-2">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Select Partner</label>
                                        <select
                                            value={outsourceLab}
                                            onChange={(e) => setOutsourceLab(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                        >
                                            <option value="">-- Select --</option>
                                            {outsourcePartners.map(partner => (
                                                <option key={partner.id || partner.name} value={partner.name}>{partner.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="opacity-50 pointer-events-none">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Lab Location</label>
                                        <input type="text" value="Main Branch (Internal)" disabled className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-100 text-sm" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Payment Mode</label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="UPI">UPI / Online</option>
                                    <option value="Insurance">Insurance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>


                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Status</label>
                                <select
                                    value={paymentStatus}
                                    onChange={(e) => {
                                        setPaymentStatus(e.target.value);
                                        // Auto-fill Advance if Paid selected
                                        if (e.target.value === 'Paid') {
                                            setAdvancePaid(calculateTotal());
                                        }
                                    }}
                                    className={`w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white font-medium ${paymentStatus === 'Pending' ? 'text-amber-600' : 'text-emerald-600'}`}
                                >
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Home Collection (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={homeCollectionCharges}
                                    onChange={(e) => setHomeCollectionCharges(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Discount (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Advance Paid (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={advancePaid}
                                    onChange={handleAdvanceChange}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                    placeholder="0"
                                />
                            </div>
                            <div className="flex-1"></div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">
                                {paymentMode === 'UPI' ? 'UTR Number / Reference ID' : 'Payment Remarks'}
                            </label>
                            <input
                                type="text"
                                value={paymentRemarks}
                                onChange={(e) => setPaymentRemarks(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                placeholder={paymentMode === 'UPI' ? 'Enter UTR Number (Optional)' : 'e.g. Cash passed to account...'}
                            />
                        </div>
                    </div>
                </div>

                {/* FOOTER: STATS & ACTION */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    <div className="space-y-3 mb-4">
                        {tatInfo && selectedTests.length > 0 && (
                            <div className="bg-blue-50 p-2 rounded-lg flex items-start gap-2 border border-blue-100">
                                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Report Delivery</p>
                                    <p className="text-xs font-medium text-blue-900">
                                        {tatInfo.date.toLocaleString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500">Subtotal</span>
                            <span className="font-semibold text-slate-700">₹{calculateSubtotal()}</span>
                        </div>
                        {discount > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Discount</span>
                                <span className="font-medium text-rose-600">- ₹{discount}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                            <div>
                                <span className="text-slate-600 font-bold block">Total Payable</span>
                                {advancePaid > 0 && <span className="text-xs text-emerald-600 font-semibold block">Paid: ₹{advancePaid}</span>}
                            </div>
                            <div className="text-right">
                                <span className="text-xl font-bold text-slate-800">₹{calculateTotal()}</span>
                                {advancePaid > 0 && <p className="text-xs text-rose-600 font-bold">Bal: ₹{Math.max(0, calculateTotal() - advancePaid)}</p>}
                            </div>
                        </div>

                        {/* Payment Confirmation Checkbox */}
                        <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <label className="flex items-start gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isPaymentConfirmed}
                                    onChange={(e) => setIsPaymentConfirmed(e.target.checked)}
                                    className="mt-1 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-slate-700">
                                    I confirm that I have received <strong>₹{advancePaid}</strong> via <strong>{paymentMode}</strong> and verified the transaction.
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={handlePrintEstimate}
                            disabled={!selectedPatient || selectedTests.length === 0}
                            className="flex-1 py-2.5 bg-white text-indigo-600 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                        >
                            <FileText className="mr-2 h-4 w-4" /> Print Estimate
                        </button>
                    </div>

                    <button
                        disabled={!selectedPatient || selectedTests.length === 0 || !isPaymentConfirmed}
                        onClick={() => {
                            if (paymentStatus === 'Paid' && advancePaid < calculateTotal()) {
                                alert("Error: Status cannot be 'Paid' if there is a Balance Due. Please change status to 'Pending' or collect full amount.");
                                return;
                            }
                            handleCreateOrder();
                        }}
                        className={`w-full py-3 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${editingOrder ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                            }`}
                    >
                        {orderStatus === 'processing' ? 'Processing...' : (editingOrder ? 'Update Order' : 'Create Order')}
                    </button>
                </div>
            </div>


            {/* Edit Patient Modal */}
            {showEditModal && fullPatientDetails && (
                <EditPatientModal
                    patient={fullPatientDetails}
                    onClose={() => setShowEditModal(false)}
                    onSave={handlePatientUpdate}
                />
            )}
        </div>
    );
};


export default Phlebotomy;

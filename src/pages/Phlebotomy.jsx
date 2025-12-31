import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Plus, Trash2, Beaker, FileText, Printer, CheckCircle, Clock, History, Download } from 'lucide-react';
import { storage } from '../data/storage';
import { useDebounce } from '../hooks/useDebounce';
import { TEST_CATALOG } from '../data/testCatalog';

const MOCK_TESTS = TEST_CATALOG;

const Phlebotomy = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [selectedTests, setSelectedTests] = useState([]);

    // Patient Search State
    const [patientSearch, setPatientSearch] = useState('');
    const debouncedPatientSearch = useDebounce(patientSearch, 300);
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientSearchResults, setPatientSearchResults] = useState([]);
    const [showPatientResults, setShowPatientResults] = useState(false);

    // Order Details State
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [paymentStatus, setPaymentStatus] = useState('Paid');
    const [advancePaid, setAdvancePaid] = useState(0); // New State
    const [paymentRemarks, setPaymentRemarks] = useState(''); // New State
    const [discount, setDiscount] = useState(0);
    const [orderStatus, setOrderStatus] = useState('new'); // new, processing, completed
    const [processingMode, setProcessingMode] = useState('In-House');
    const [outsourceLab, setOutsourceLab] = useState('');
    const [patientHistory, setPatientHistory] = useState([]);

    const OUTSOURCE_PARTNERS = [
        'Lal PathLabs', 'Metropolis', 'Thyrocare', 'Redcliffe', 'Max Lab', 'Local Hospital Reference'
    ];

    // TAT Calculation
    const calculateTAT = (tests) => {
        if (!tests || tests.length === 0) return null;
        let maxHours = 12;
        tests.forEach(test => {
            const cat = test.category ? test.category.toUpperCase() : '';
            if (cat.includes('MICROBIOLOGY') || cat.includes('CULTURE')) maxHours = Math.max(maxHours, 48);
            else if (cat.includes('IMMUNOLOGY') || cat.includes('SEROLOGY') || cat.includes('MOLECULAR')) maxHours = Math.max(maxHours, 24);
            else maxHours = Math.max(maxHours, 12);
        });
        const reportDate = new Date();
        reportDate.setHours(reportDate.getHours() + maxHours);
        return { date: reportDate, hours: maxHours };
    };

    const tatInfo = calculateTAT(selectedTests);

    // Initial Load - Check for Prefill
    useEffect(() => {
        if (location.state?.prefillPatient) {
            setSelectedPatient({
                name: location.state.prefillPatient,
                id: location.state.patientId
            });
            setPatientSearch(location.state.prefillPatient);
            if (location.state.paymentMode) setPaymentMode(location.state.paymentMode);
        }
    }, [location.state]);

    // Search Patients
    useEffect(() => {
        if (debouncedPatientSearch && !selectedPatient) {
            const results = storage.searchPatients(debouncedPatientSearch);
            setPatientSearchResults(results);
            setShowPatientResults(true);
        } else {
            setPatientSearchResults([]);
            setShowPatientResults(false);
        }
    }, [debouncedPatientSearch, selectedPatient]);

    // Load History when patient selected
    useEffect(() => {
        if (selectedPatient?.id) {
            const allOrders = storage.getOrders();
            const history = allOrders
                .filter(o => o.patientId === selectedPatient.id)
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setPatientHistory(history);
        } else {
            setPatientHistory([]);
        }
    }, [selectedPatient]);

    const selectPatient = (patient) => {
        setSelectedPatient({ name: patient.fullName, id: patient.id });
        setPatientSearch(patient.fullName);
        setPatientSearchResults([]);
        setShowPatientResults(false);
    };

    const clearPatient = () => {
        setSelectedPatient(null);
        setPatientSearch('');
    };

    const filteredTests = MOCK_TESTS.filter(test =>
        test.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
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
        return selectedTests.reduce((acc, curr) => acc + curr.price, 0);
    };

    const calculateTotal = () => {
        return Math.max(0, calculateSubtotal() - discount);
    };

    const handleCreateOrder = () => {
        if (!selectedPatient || selectedTests.length === 0) return;
        setOrderStatus('processing');

        const orderData = {
            id: `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`, // Simple ID generation
            patientId: selectedPatient.id,
            patientName: selectedPatient.name,
            tests: selectedTests,
            subtotal: calculateSubtotal(),
            discount: discount,
            totalAmount: calculateTotal(),
            advancePaid: advancePaid,
            balanceDue: calculateTotal() - advancePaid,
            paymentRemarks: paymentRemarks,
            status: 'pending', // Initial status for tracking
            paymentMode: paymentMode,
            paymentStatus: paymentStatus,
            processingMode: processingMode,
            outsourceLab: processingMode === 'Outsource' ? outsourceLab : null,
            createdAt: new Date().toISOString()
        };

        storage.saveOrder(orderData);

        // Simulate processing persistence
        setTimeout(() => {
            setOrderStatus('completed');
        }, 1000);
    };

    const handleReset = () => {
        setSelectedTests([]);
        setSelectedPatient(null);
        setPatientSearch('');
        setOrderStatus('new');
        setSearchTerm('');
        navigate('.', { replace: true, state: {} });
    };

    if (orderStatus === 'completed') {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 max-w-lg mx-auto">
                    <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="h-10 w-10 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Created Successfully!</h2>
                    <p className="text-slate-500 mb-8">
                        Samples have been registered for <span className="font-semibold text-slate-700">{selectedPatient?.name}</span>.
                    </p>
                    <div className="space-y-3">
                        <button onClick={() => window.print()} className="w-full py-3 px-4 bg-slate-800 text-white rounded-xl font-medium hover:bg-slate-900 flex items-center justify-center transition-colors">
                            <Printer className="mr-2 h-5 w-5" /> Print Barcode Labels
                        </button>
                        <button onClick={handleReset} className="w-full py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
                            Create New Order
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
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Select Tests</h2>
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

                <div className="flex-1 overflow-y-auto p-2">
                    {filteredTests.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <Beaker className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No tests found matching "{searchTerm}"</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredTests.map(test => {
                                const isSelected = selectedTests.find(t => t.id === test.id);
                                return (
                                    <button
                                        key={test.id}
                                        onClick={() => !isSelected && addTest(test)}
                                        disabled={isSelected}
                                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${isSelected
                                            ? 'bg-indigo-50 border-indigo-200 opacity-60 cursor-default'
                                            : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'
                                            }`}
                                    >
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{test.name}</h3>
                                            <div className="flex items-center mt-1 space-x-2">
                                                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">{test.code}</span>
                                                <span className="text-xs text-slate-400">{test.category}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="font-bold text-slate-700 mr-3">₹{test.price}</span>
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
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Requisition</h2>

                    {/* Patient Selector */}
                    <div className="relative mb-4">
                        {selectedPatient ? (
                            <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                <div>
                                    <p className="text-xs text-indigo-500 font-semibold uppercase tracking-wider">Patient</p>
                                    <p className="font-bold text-indigo-900">{selectedPatient.name}</p>
                                </div>
                                <button onClick={clearPatient} className="p-1 hover:bg-indigo-100 rounded-full text-indigo-400 hover:text-indigo-600 transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedTests.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p className="text-sm">No tests selected yet.</p>
                        </div>
                    ) : (
                        selectedTests.map(test => (
                            <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                                <div>
                                    <h4 className="font-medium text-slate-800 text-sm">{test.name}</h4>
                                    <span className="text-xs text-slate-500">{test.code}</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-semibold text-slate-700 text-sm mr-3">₹{test.price}</span>
                                    <button onClick={() => removeTest(test.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="mb-4 space-y-4">
                        {/* Processing Mode Selection */}
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
                                            {OUTSOURCE_PARTNERS.map(partner => (
                                                <option key={partner} value={partner}>{partner}</option>
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
                                    onChange={(e) => setPaymentStatus(e.target.value)}
                                    className={`w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white font-medium ${paymentStatus === 'Pending' ? 'text-amber-600' : 'text-emerald-600'}`}
                                >
                                    <option value="Paid">Paid</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 mb-4 items-center">
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
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Advance Paid (₹)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={advancePaid}
                                    onChange={(e) => setAdvancePaid(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Payment Remarks / UTR No.</label>
                            <input
                                type="text"
                                value={paymentRemarks}
                                onChange={(e) => setPaymentRemarks(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm bg-white"
                                placeholder="e.g. UTR: 1234567890 or Cash Ref..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2 mb-4 border-t border-slate-200 pt-4">
                        {tatInfo && (
                            <div className="bg-blue-50 p-3 rounded-lg flex items-start gap-3 mb-4 border border-blue-100">
                                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Expected Report Delivery</p>
                                    <p className="text-sm font-medium text-blue-900">
                                        {tatInfo.date.toLocaleString('en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                        })}
                                    </p>
                                    <p className="text-xs text-blue-600 mt-0.5">TAT: ~{tatInfo.hours} Hours</p>
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
                                <span className="text-2xl font-bold text-slate-800">₹{calculateTotal()}</span>
                                {advancePaid > 0 && <p className="text-xs text-rose-600 font-bold">Bal: ₹{Math.max(0, calculateTotal() - advancePaid)}</p>}
                            </div>
                        </div>
                    </div>
                    <button
                        disabled={!selectedPatient || selectedTests.length === 0}
                        onClick={handleCreateOrder}
                        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                    >
                        {orderStatus === 'processing' ? 'Processing...' : 'Create Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Phlebotomy;

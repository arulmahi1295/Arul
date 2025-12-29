import React, { useState } from 'react';
import { Search, Plus, Trash2, Beaker, FileText, Printer, CheckCircle } from 'lucide-react';

const MOCK_TESTS = [
    { id: 1, code: 'CBC', name: 'Complete Blood Count', price: 15, category: 'Hematology', color: 'bg-red-100 text-red-700' },
    { id: 2, code: 'LIPID', name: 'Lipid Profile', price: 25, category: 'Biochemistry', color: 'bg-orange-100 text-orange-700' },
    { id: 3, code: 'TSH', name: 'Thyroid Stimulating Hormone', price: 12, category: 'Hormones', color: 'bg-purple-100 text-purple-700' },
    { id: 4, code: 'HBA1C', name: 'HbA1c (Glycated Hemoglobin)', price: 18, category: 'Biochemistry', color: 'bg-blue-100 text-blue-700' },
    { id: 5, code: 'URINE', name: 'Urine Analysis', price: 10, category: 'Clinical Pathology', color: 'bg-yellow-100 text-yellow-700' },
    { id: 6, code: 'VITD', name: 'Vitamin D Total', price: 30, category: 'Immunoassay', color: 'bg-emerald-100 text-emerald-700' },
];

const Phlebotomy = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTests, setSelectedTests] = useState([]);
    const [patientId, setPatientId] = useState('');
    const [orderStatus, setOrderStatus] = useState('new'); // new, processing, completed

    const filteredTests = MOCK_TESTS.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const addTest = (test) => {
        if (!selectedTests.find(t => t.id === test.id)) {
            setSelectedTests([...selectedTests, test]);
        }
    };

    const removeTest = (testId) => {
        setSelectedTests(selectedTests.filter(t => t.id !== testId));
    };

    const calculateTotal = () => {
        return selectedTests.reduce((acc, curr) => acc + curr.price, 0);
    };

    const handleCreateOrder = () => {
        if (!patientId || selectedTests.length === 0) return;
        setOrderStatus('processing');
        console.log('Order Created for Patient:', patientId, 'Tests:', selectedTests);

        // Simulate printing labels and order creation
        setTimeout(() => {
            setOrderStatus('completed');
        }, 1500);
    };

    const handleReset = () => {
        setSelectedTests([]);
        setPatientId('');
        setOrderStatus('new');
        setSearchTerm('');
    };

    if (orderStatus === 'completed') {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center">
                <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-12 w-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Order Created Successfully!</h2>
                <p className="text-slate-500 mb-8">Order #ORD-2024-001 has been queued for processing. Labels are printing.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={handleReset} className="px-6 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors">
                        Start New Order
                    </button>
                    <button className="px-6 py-3 bg-indigo-600 rounded-xl text-white font-medium hover:bg-indigo-700 transition-colors flex items-center">
                        <Printer className="mr-2 h-5 w-5" /> Print Labels
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-6 h-[calc(100vh-100px)]">
            {/* Left: Test Selection */}
            <div className="flex-1 flex flex-col">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-800">New Order</h1>
                    <p className="text-slate-500">Select tests to add to the requisition.</p>
                </header>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search tests by name or code..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 font-medium transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredTests.map(test => (
                            <div key={test.id} className="group flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer" onClick={() => addTest(test)}>
                                <div className="flex items-center">
                                    <div className={`h-10 w-10 rounded-lg ${test.color} flex items-center justify-center font-bold text-xs mr-4`}>
                                        {test.code}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{test.name}</h3>
                                        <p className="text-xs text-slate-500 font-medium bg-slate-100 inline-block px-2 py-0.5 rounded mt-1">{test.category}</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="font-bold text-slate-700 mr-4">${test.price}</span>
                                    <button className="h-8 w-8 rounded-full bg-slate-100 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-colors">
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {filteredTests.length === 0 && (
                            <div className="text-center py-12 text-slate-400">
                                <Beaker className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                <p>No tests found matching "{searchTerm}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Order Summary */}
            <div className="w-96 flex flex-col">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="font-bold text-slate-800 flex items-center">
                            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                            Requisition Summary
                        </h2>
                    </div>

                    <div className="p-4 border-b border-slate-100">
                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Patient ID / Name</label>
                        <input
                            type="text"
                            placeholder="Enter Patient ID"
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                            value={patientId}
                            onChange={(e) => setPatientId(e.target.value)}
                        />
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
                                        <span className="font-semibold text-slate-700 text-sm mr-3">${test.price}</span>
                                        <button onClick={() => removeTest(test.id)} className="text-slate-400 hover:text-rose-500 transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-6 bg-slate-50 border-t border-slate-100">
                        <div className="flex justify-between items-end mb-4">
                            <span className="text-slate-500 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-slate-800">${calculateTotal()}</span>
                        </div>
                        <button
                            disabled={!patientId || selectedTests.length === 0}
                            onClick={handleCreateOrder}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
                        >
                            {orderStatus === 'processing' ? 'Processing...' : 'Create Order & Print Labels'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Phlebotomy;

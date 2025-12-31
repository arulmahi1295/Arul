import React, { useState, useEffect } from 'react';
import { Filter, Search, Truck, Building2, CheckCircle, Clock, AlertCircle, Play, PackageCheck } from 'lucide-react';
import { storage } from '../data/storage';

const Accession = () => {
    const [activeTab, setActiveTab] = useState('reception'); // reception | assignment | processing | completed
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLab, setSelectedLab] = useState('In-House');

    // Stats for tabs
    const [stats, setStats] = useState({ reception: 0, assignment: 0, processing: 0, completed: 0 });

    useEffect(() => {
        loadOrders();
    }, [activeTab]); // Reload when tab changes

    const loadOrders = () => {
        const allOrders = storage.getOrders();
        // Sort by date desc
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Calculate Stats
        const newStats = {
            reception: allOrders.filter(o => o.status === 'pending').length,
            assignment: allOrders.filter(o => o.status === 'collected').length, // collected but not assigned
            processing: allOrders.filter(o => o.status === 'processing').length,
            completed: allOrders.filter(o => o.status === 'completed').length,
        };
        setStats(newStats);

        // Filter by Tab
        let filtered = [];
        if (activeTab === 'reception') filtered = allOrders.filter(o => o.status === 'pending');
        else if (activeTab === 'assignment') filtered = allOrders.filter(o => o.status === 'collected');
        else if (activeTab === 'processing') filtered = allOrders.filter(o => o.status === 'processing');
        else if (activeTab === 'completed') filtered = allOrders.filter(o => o.status === 'completed');

        setOrders(filtered);
    };

    const handleReceiveSample = (orderId) => {
        storage.updateOrder(orderId, {
            status: 'collected',
            collectionDate: new Date().toISOString()
        });
        loadOrders();
    };

    const handleAssignLab = (orderId, testIndex, labName) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const updatedTests = [...order.tests];
        updatedTests[testIndex] = { ...updatedTests[testIndex], labPartner: labName };

        // Check if all tests have a lab partner assigned
        const allAssigned = updatedTests.every(t => t.labPartner);

        const updates = {
            tests: updatedTests,
            accessionDate: new Date().toISOString()
        };

        if (allAssigned) {
            updates.status = 'processing';
        }

        storage.updateOrder(orderId, updates);
        loadOrders();
    };

    // Filter by search
    const displayedOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const labPartners = ['In-House', 'Lal PathLabs', 'Thyrocare', 'Metropolis', 'Redcliffe'];

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                    <PackageCheck className="mr-3 h-8 w-8 text-indigo-600" />
                    Central Accession & Outsourcing
                </h1>
                <p className="text-slate-500 mt-1">Receive samples, assign output labs, and track movements.</p>
            </header>

            {/* Tabs */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('reception')}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${activeTab === 'reception' ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200 shadow-md transform scale-[1.02]' : 'glass-panel hover:border-brand-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-bold text-slate-400">Step 1</span>
                        <Truck className={`h-5 w-5 ${activeTab === 'reception' ? 'text-brand-600' : 'text-slate-300'}`} />
                    </div>
                    <div className="font-bold text-slate-800 text-lg">Sample Reception</div>
                    <div className="text-sm text-slate-500">{stats.reception} Pending</div>
                </button>

                <button
                    onClick={() => setActiveTab('assignment')}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${activeTab === 'assignment' ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200 shadow-md transform scale-[1.02]' : 'glass-panel hover:border-indigo-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-bold text-slate-400">Step 2</span>
                        <Building2 className={`h-5 w-5 ${activeTab === 'assignment' ? 'text-indigo-600' : 'text-slate-300'}`} />
                    </div>
                    <div className="font-bold text-slate-800 text-lg">Lab Assignment</div>
                    <div className="text-sm text-slate-500">{stats.assignment} To Assign</div>
                </button>

                <button
                    onClick={() => setActiveTab('processing')}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${activeTab === 'processing' ? 'bg-violet-50 border-violet-200 ring-1 ring-violet-200 shadow-md transform scale-[1.02]' : 'glass-panel hover:border-violet-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-bold text-slate-400">Step 3</span>
                        <Play className={`h-5 w-5 ${activeTab === 'processing' ? 'text-violet-600' : 'text-slate-300'}`} />
                    </div>
                    <div className="font-bold text-slate-800 text-lg">In Processing</div>
                    <div className="text-sm text-slate-500">{stats.processing} Active</div>
                </button>

                <button
                    onClick={() => setActiveTab('completed')}
                    className={`p-4 rounded-xl border text-left transition-all duration-300 ${activeTab === 'completed' ? 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200 shadow-md transform scale-[1.02]' : 'glass-panel hover:border-emerald-200'}`}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs uppercase font-bold text-slate-400">Final</span>
                        <CheckCircle className={`h-5 w-5 ${activeTab === 'completed' ? 'text-emerald-500' : 'text-slate-300'}`} />
                    </div>
                    <div className="font-bold text-slate-800 text-lg">Completed</div>
                    <div className="text-sm text-slate-500">{stats.completed} Done</div>
                </button>
            </div>

            {/* Content Area */}
            <div className="glass-panel rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Order ID or Patient..."
                            className="input-field w-full pl-9 pr-4 py-2 rounded-lg text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Tests</th>
                                <th className="px-6 py-4">Assigned Lab</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {displayedOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-12 text-slate-400">No orders found in this stage.</td>
                                </tr>
                            ) : (
                                displayedOrders.map(order => (
                                    <tr key={order.id} className="hover:bg-brand-50/30 transition-colors">
                                        <td className="px-6 py-4 font-mono font-medium text-slate-600">{order.id}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800">{order.patientId}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600">
                                            {order.tests.map(t => t.name).join(', ')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {activeTab === 'assignment' ? (
                                                <div className="space-y-2">
                                                    {order.tests.map((test, index) => (
                                                        <div key={index} className="flex items-center justify-between gap-2 text-sm bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                            <span className="font-medium text-slate-700 truncate max-w-[150px]" title={test.name}>{test.name}</span>
                                                            <select
                                                                className="px-2 py-1 rounded border border-slate-300 text-xs focus:border-brand-500 outline-none w-32"
                                                                value={test.labPartner || ''}
                                                                onChange={(e) => handleAssignLab(order.id, index, e.target.value)}
                                                            >
                                                                <option value="" disabled>Select Lab...</option>
                                                                {labPartners.map(lab => (
                                                                    <option key={lab} value={lab}>{lab}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    {order.tests.map((test, index) => (
                                                        <div key={index} className="flex items-center gap-2 text-xs">
                                                            <div className={`h-2 w-2 rounded-full ${test.labPartner === 'In-House' || !test.labPartner ? 'bg-brand-500' : 'bg-violet-500'}`}></div>
                                                            <span className="text-slate-600 truncate max-w-[120px]">{test.name}</span>
                                                            <span className="font-semibold text-slate-800 ml-auto">{test.labPartner || 'In-House'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {activeTab === 'reception' && (
                                                <button
                                                    onClick={() => handleReceiveSample(order.id)}
                                                    className="btn-primary px-3 py-1.5 rounded-lg text-sm font-medium flex items-center ml-auto"
                                                >
                                                    <Truck className="h-4 w-4 mr-2" /> Receive Sample
                                                </button>
                                            )}
                                            {activeTab === 'assignment' && (
                                                <span className="text-xs text-slate-400 italic">Assign labs for all tests to proceed →</span>
                                            )}
                                            {activeTab === 'processing' && (
                                                <span className="text-xs text-orange-500 font-medium flex items-center justify-end">
                                                    <Clock className="h-3 w-3 mr-1" /> Processing
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Accession;

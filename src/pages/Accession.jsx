import React, { useState, useEffect } from 'react';
import { Filter, Search, Truck, Building2, CheckCircle, Clock, AlertCircle, Play, PackageCheck, FileDown } from 'lucide-react';
import { storage } from '../data/storage';

const Accession = () => {
    const [activeTab, setActiveTab] = useState('reception'); // reception | assignment | processing | completed
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLab, setSelectedLab] = useState('In-House');
    const [inventoryItems, setInventoryItems] = useState([]);

    // Stats for tabs
    const [stats, setStats] = useState({ reception: 0, assignment: 0, processing: 0, completed: 0 });

    useEffect(() => {
        loadOrders();
        loadInventory();
    }, [activeTab]); // Reload when tab changes

    const loadInventory = async () => {
        const items = await storage.getInventory();
        setInventoryItems(items);
    };

    const loadOrders = async () => {
        const allOrders = await storage.getOrders();
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

    const deductStock = async (order) => {
        let log = [];
        // Heuristic: 1 tube per Unique Category per Patient
        const cats = new Set(order.tests.map(t => (t.category || '').toUpperCase()));

        for (const cat of cats) {
            let keywords = [];
            if (cat === 'HEMATOLOGY') keywords = ['EDTA', 'LAVENDER', 'CBC'];
            else if (cat.includes('BIOCHEMISTRY') || cat.includes('IMMUNOLOGY') || cat.includes('SEROLOGY')) keywords = ['SST', 'YELLOW', 'SERUM', 'PLAIN', 'CLOT'];
            else if (cat.includes('GLUCOSE') || cat.includes('DIABETES')) keywords = ['FLUORIDE', 'GREY', 'GRAY'];
            else if (cat.includes('COAGULATION')) keywords = ['CITRATE', 'BLUE'];
            else if (cat.includes('URINE') || cat.includes('CLINICAL')) keywords = ['URINE', 'CONTAINER'];

            if (keywords.length > 0) {
                // Find first matching item with stock
                const item = inventoryItems.find(i =>
                    keywords.some(k => i.name.toUpperCase().includes(k)) && Number(i.quantity) > 0
                );

                if (item) {
                    await storage.updateInventoryItem(item.id, { quantity: Number(item.quantity) - 1 });
                    // Update local state to prevent double deduction if multiple orders processed quickly
                    setInventoryItems(prev => prev.map(p => p.id === item.id ? { ...p, quantity: Number(p.quantity) - 1 } : p));
                    log.push(item.name);
                }
            }
        }
        return log;
    };

    const handleReceiveSample = async (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        // Auto-deduct inventory
        const usedStock = await deductStock(order);

        await storage.updateOrder(orderId, {
            status: 'collected',
            collectionDate: new Date().toISOString()
        });

        if (usedStock.length > 0) {
            alert(`Sample Received. Stock deducted: ${usedStock.join(', ')}`);
        } else {
            // alert('Sample Received.'); // Optional: Less noise
        }

        loadOrders();
    };

    const [selectedOrderId, setSelectedOrderId] = useState(null);

    // Auto-select first order in assignment tab
    useEffect(() => {
        if (activeTab === 'assignment' && orders.length > 0 && !selectedOrderId) {
            // Find first pending assignment
            const first = orders.find(o => o.status === 'collected');
            if (first) setSelectedOrderId(first.id);
        }
    }, [activeTab, orders, selectedOrderId]);

    const handleAssignLab = async (orderId, testIndex, labName, cost = 0) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const updatedTests = [...order.tests];
        updatedTests[testIndex] = {
            ...updatedTests[testIndex],
            labPartner: labName,
            outsourcedCost: parseFloat(cost) || 0,
            settlementStatus: 'Pending' // Pending | Settled
        };

        // Check if all tests have a lab partner assigned
        const allAssigned = updatedTests.every(t => t.labPartner);

        const updates = {
            tests: updatedTests,
            accessionDate: new Date().toISOString()
        };

        if (allAssigned) {
            updates.status = 'processing';
            // If currently selected, move to next or null
            if (selectedOrderId === orderId) {
                const next = orders.find(o => o.id !== orderId && o.status === 'collected');
                setSelectedOrderId(next ? next.id : null);
            }
        }

        await storage.updateOrder(orderId, updates);
        loadOrders();
    };

    // Filter by search
    const displayedOrders = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const [labPartners, setLabPartners] = useState(['In-House']);

    useEffect(() => {
        loadLabPartners();
    }, []);

    const loadLabPartners = async () => {
        const labs = await storage.getOutsourceLabs();
        // Assuming labs is array of objects { name, type, ... }
        // We want a simple list of names for the dropdown, starting with In-House
        const names = ['In-House', ...labs.map(l => l.name)];
        // Remove duplicates just in case
        setLabPartners([...new Set(names)]);
    };

    // Helper to calculate TAT
    const getTATInfo = (order) => {
        let maxHours = 12;
        if (order.tests) {
            order.tests.forEach(test => {
                const cat = test.category ? test.category.toUpperCase() : '';
                if (cat.includes('MICROBIOLOGY') || cat.includes('CULTURE')) maxHours = Math.max(maxHours, 48);
                else if (cat.includes('IMMUNOLOGY') || cat.includes('SEROLOGY') || cat.includes('MOLECULAR')) maxHours = Math.max(maxHours, 24);
            });
        }
        const created = new Date(order.createdAt);
        const tatLimit = new Date(created.getTime() + maxHours * 60 * 60 * 1000);
        const now = new Date();
        const isOverdue = now > tatLimit && order.status !== 'completed';

        return { tatLimit, isOverdue };
    };

    const handleDownloadTATReport = async () => {
        const headers = ['Order ID', 'Patient', 'Tests', 'Assigned Lab', 'Order Date', 'TAT Deadline', 'Status', 'Risk Level'];
        const csvRows = [headers.join(',')];

        const allOrders = await storage.getOrders();
        allOrders.forEach(order => {
            const { tatLimit, isOverdue } = getTATInfo(order);
            const status = isOverdue ? 'OVERDUE' : (order.status === 'completed' ? 'Completed' : 'On Time');
            const tests = order.tests.map(t => t.name).join(' | ');
            const labs = order.tests.map(t => t.labPartner || 'Pending').join(' | ');
            const risk = isOverdue ? 'CRITICAL' : 'Normal';

            const row = [
                order.id,
                `"${order.patientName || order.patientId}"`,
                `"${tests}"`,
                `"${labs}"`,
                new Date(order.createdAt).toLocaleDateString(),
                tatLimit.toLocaleString(),
                status,
                risk
            ];
            csvRows.push(row.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TAT_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const renderAssignmentView = () => {
        if (displayedOrders.length === 0) {
            return (
                <div className="glass-card flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                    <div className="bg-slate-50 p-6 rounded-full mb-4 shadow-inner">
                        <PackageCheck className="h-12 w-12 text-slate-300" />
                    </div>
                    <p className="text-xl font-bold text-slate-700">All caught up!</p>
                    <p className="text-slate-400">No pending orders to assign.</p>
                </div>
            );
        }

        const selectedOrder = displayedOrders.find(o => o.id === selectedOrderId) || displayedOrders[0];

        return (
            <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                {/* Left Panel: List */}
                <div className="lg:w-1/3 glass-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="p-4 border-b border-white/50 bg-white/40 backdrop-blur-sm">
                        <h3 className="font-bold text-slate-700 flex items-center">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2 animate-pulse"></span>
                            Pending Assignment ({displayedOrders.length})
                        </h3>
                    </div>
                    <div className="overflow-y-auto flex-1 p-3 space-y-3 custom-scrollbar">
                        {displayedOrders.map(order => {
                            const { tatLimit, isOverdue } = getTATInfo(order);
                            const isSelected = selectedOrder && selectedOrder.id === order.id;
                            const assignedCount = order.tests.filter(t => t.labPartner).length;
                            const totalTests = order.tests.length;

                            return (
                                <div
                                    key={order.id}
                                    onClick={() => setSelectedOrderId(order.id)}
                                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${isSelected
                                        ? 'bg-gradient-to-r from-indigo-50 to-white border-indigo-200 ring-1 ring-indigo-200 shadow-md transform scale-[1.02]'
                                        : 'bg-white/50 border-white/60 hover:border-indigo-200 hover:bg-white/80 hover:shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>
                                            {order.id}
                                        </span>
                                        {isOverdue && <div className="flex items-center text-rose-500 text-[10px] font-bold bg-rose-50 px-2 py-0.5 rounded-full"><AlertCircle className="h-3 w-3 mr-1" /> OVERDUE</div>}
                                    </div>
                                    <h4 className={`font-bold text-sm mb-2 ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                                        {order.patientName || order.patientId}
                                    </h4>
                                    <div className="flex justify-between items-center text-xs">
                                        <div className="flex items-center text-slate-500">
                                            <Clock className="h-3 w-3 mr-1" />
                                            {tatLimit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${assignedCount === totalTests ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                                                    style={{ width: `${(assignedCount / totalTests) * 100}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-bold text-slate-600">{assignedCount}/{totalTests}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Detail */}
                <div className="lg:w-2/3 glass-card flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 delay-100">
                    {selectedOrder ? (
                        <>
                            {/* Detail Header */}
                            <div className="p-6 border-b border-white/50 bg-gradient-to-b from-white/60 to-white/30 backdrop-blur-sm flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{selectedOrder.patientName || selectedOrder.patientId}</h2>
                                    </div>
                                    <div className="flex gap-4 text-sm font-medium text-slate-500">
                                        <div className="flex items-center bg-white/50 px-3 py-1 rounded-lg border border-white/50">
                                            <Clock className="h-4 w-4 mr-2 text-indigo-400" />
                                            Received: {new Date(selectedOrder.collectionDate || selectedOrder.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Status</div>
                                    {selectedOrder.tests.every(t => t.labPartner) ? (
                                        <div className="flex flex-col items-end animate-in zoom-in spin-in-3 duration-300">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20">
                                                <CheckCircle className="h-4 w-4 mr-2" /> Ready
                                            </span>
                                            <span className="text-[10px] text-emerald-600 mt-1 font-medium">All labs assigned</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-end">
                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-white text-amber-600 border border-amber-200 shadow-sm">
                                                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2 animate-pulse"></div>
                                                Action Required
                                            </span>
                                            <span className="text-[10px] text-slate-400 mt-1 font-medium">Please assign labs below</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Detail Body (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar">
                                <div className="space-y-4">
                                    {selectedOrder.tests.map((test, index) => (
                                        <div key={index} className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all duration-300 group">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h4 className="font-bold text-indigo-900 text-lg">{test.name}</h4>
                                                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{test.code}</span>
                                                    </div>
                                                    <div className="text-xs font-medium text-slate-500 bg-slate-50 inline-block px-2 py-1 rounded-md">
                                                        {test.category || 'General'}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3 w-full sm:w-auto">
                                                    <div className="flex flex-col w-full sm:w-56">
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Assigned Lab Partner</label>
                                                        <div className="relative">
                                                            <Building2 className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none transition-colors ${test.labPartner ? (test.labPartner === 'In-House' ? 'text-emerald-500' : 'text-indigo-500') : 'text-slate-400'}`} />
                                                            <select
                                                                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-bold focus:ring-4 outline-none transition-all cursor-pointer appearance-none ${test.labPartner
                                                                    ? (test.labPartner === 'In-House'
                                                                        ? 'border-emerald-200 bg-emerald-50/50 text-emerald-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                                                                        : 'border-indigo-200 bg-indigo-50/50 text-indigo-800 focus:border-indigo-500 focus:ring-indigo-500/20')
                                                                    : 'border-slate-200 bg-white text-slate-600 focus:border-indigo-400 focus:ring-indigo-500/10 hover:border-indigo-200'}`}
                                                                value={test.labPartner || ''}
                                                                onChange={(e) => handleAssignLab(selectedOrder.id, index, e.target.value, test.outsourcedCost)}
                                                            >
                                                                <option value="" disabled>Select Lab Partner</option>
                                                                {labPartners.map(lab => (
                                                                    <option key={lab} value={lab}>{lab}</option>
                                                                ))}
                                                            </select>
                                                            {/* Custom Dropdown Arrow */}
                                                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {test.labPartner && test.labPartner !== 'In-House' && (
                                                        <div className="flex flex-col w-28 animate-in fade-in slide-in-from-left-2 duration-300">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Cost (₹)</label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none text-right transition-all"
                                                                    value={test.outsourcedCost || ''}
                                                                    onChange={(e) => handleAssignLab(selectedOrder.id, index, test.labPartner, e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                            <div className="bg-slate-50 p-6 rounded-full shadow-inner mb-6">
                                <Truck className="h-16 w-16 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-600">No Order Selected</h3>
                            <p>Select a pending order from the list to assign labs</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-6 h-screen flex flex-col">
            <header className="mb-6 flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center tracking-tight">
                        <PackageCheck className="mr-3 h-8 w-8 text-indigo-600" />
                        Accession & Outsourcing
                    </h1>
                    <p className="text-slate-500 mt-2 text-lg">Manage sample reception, lab assignment, and tracking.</p>
                </div>
                <button
                    onClick={handleDownloadTATReport}
                    className="flex items-center bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-indigo-600 px-5 py-2.5 rounded-xl transition-all shadow-sm font-medium"
                >
                    <FileDown className="h-5 w-5 mr-2" />
                    Download TAT Report
                </button>
            </header>

            {/* Tabs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 flex-shrink-0">
                {[
                    { id: 'reception', label: 'Sample Reception', icon: Truck, color: 'brand', step: 'Step 1' },
                    { id: 'assignment', label: 'Lab Assignment', icon: Building2, color: 'indigo', step: 'Step 2' },
                    { id: 'processing', label: 'In Processing', icon: Play, color: 'violet', step: 'Step 3' },
                    { id: 'completed', label: 'Completed', icon: CheckCircle, color: 'emerald', step: 'Final' }
                ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    const count = stats[tab.id];
                    // Dynamic color classes
                    const activeClasses = {
                        brand: 'bg-brand-50 border-brand-200 ring-1 ring-brand-200',
                        indigo: 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200',
                        violet: 'bg-violet-50 border-violet-200 ring-1 ring-violet-200',
                        emerald: 'bg-emerald-50 border-emerald-200 ring-1 ring-emerald-200'
                    };
                    const iconColors = {
                        brand: 'text-brand-600',
                        indigo: 'text-indigo-600',
                        violet: 'text-violet-600',
                        emerald: 'text-emerald-600'
                    };

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`p-4 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden group ${isActive ? activeClasses[tab.color] + ' shadow-md scale-[1.02]' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                        >
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <span className={`text-xs uppercase font-bold tracking-wider ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>{tab.step}</span>
                                <tab.icon className={`h-5 w-5 ${isActive ? iconColors[tab.color] : 'text-slate-300 group-hover:text-slate-400'}`} />
                            </div>
                            <div className="font-bold text-slate-800 text-lg mb-0.5 relative z-10">{tab.label}</div>
                            <div className={`text-xs font-medium relative z-10 ${isActive ? 'text-slate-600' : 'text-slate-400'}`}>
                                {count} {tab.id === 'reception' ? 'Pending' : tab.id === 'assignment' ? 'To Assign' : tab.id === 'processing' ? 'Active' : 'Done'}
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Content Area */}
            {activeTab === 'assignment' ? renderAssignmentView() : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col flex-1">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Order ID, Patient, or Test..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold tracking-wider sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 w-[250px] bg-slate-50">Order Info</th>
                                    <th className="px-6 py-4 bg-slate-50">Tests</th>
                                    <th className="px-6 py-4 w-[200px] bg-slate-50">Assigned Lab</th>
                                    <th className="px-6 py-4 text-right w-[180px] bg-slate-50">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {displayedOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-16 text-slate-400">
                                            <div className="flex flex-col items-center justify-center">
                                                <PackageCheck className="h-12 w-12 text-slate-200 mb-4" />
                                                <p className="text-lg font-medium text-slate-500">No orders found in this stage.</p>
                                                <p className="text-sm text-slate-400">Check other tabs or try a different search.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayedOrders.map(order => {
                                        const { tatLimit, isOverdue } = getTATInfo(order);

                                        // Determine row styling
                                        let rowClass = "hover:bg-slate-50 transition-colors group";
                                        if (isOverdue) rowClass = "bg-rose-50/50 hover:bg-rose-50 transition-colors border-l-4 border-rose-500";

                                        return (
                                            <tr key={order.id} className={rowClass}>
                                                {/* Order Info Column */}
                                                <td className="px-6 py-5 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 w-fit px-2 py-0.5 rounded-md border border-indigo-100">
                                                            {order.id}
                                                        </span>
                                                        <div className="font-bold text-slate-800 text-base mt-1">{order.patientName || order.patientId}</div>
                                                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-2">
                                                            {isOverdue ? (
                                                                <span className="flex items-center text-rose-700 font-bold bg-rose-100 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide">
                                                                    <AlertCircle className="h-3 w-3 mr-1" />
                                                                    Overdue
                                                                </span>
                                                            ) : (
                                                                <span className={`flex items-center font-medium ${activeTab === 'completed' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full' : 'text-slate-400'}`}>
                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                    {activeTab === 'completed' ? 'Completed' : `Due: ${tatLimit.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Tests Column (Table View) */}
                                                <td className="px-6 py-5 align-top">
                                                    <div className="flex flex-wrap gap-2">
                                                        {order.tests.map((test, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                                                {test.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Assigned Lab Column */}
                                                <td className="px-6 py-5 align-top">
                                                    <div className="flex flex-col gap-1.5">
                                                        {order.tests.map((test, index) => (
                                                            <div key={index} className="flex items-center justify-between text-xs group/item">
                                                                <span className="text-slate-500 truncate max-w-[120px] mr-2">{test.name}</span>
                                                                <span className={`font-semibold px-2 py-0.5 rounded-md border ${test.labPartner === 'In-House' || !test.labPartner
                                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                                    : 'bg-violet-50 text-violet-700 border-violet-100'
                                                                    }`}>
                                                                    {test.labPartner || 'In-House'}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Actions Column */}
                                                <td className="px-6 py-5 align-top text-right">
                                                    {activeTab === 'reception' && (
                                                        <button
                                                            onClick={() => handleReceiveSample(order.id)}
                                                            className="w-full sm:w-auto inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow active:scale-95"
                                                        >
                                                            <Truck className="h-4 w-4 mr-2" />
                                                            Receive
                                                        </button>
                                                    )}
                                                    {activeTab === 'processing' && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600 border border-amber-100">
                                                            <Clock className="h-3 w-3 mr-1.5" />
                                                            Processing
                                                        </span>
                                                    )}
                                                    {activeTab === 'completed' && (
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                                            View Report
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Accession;

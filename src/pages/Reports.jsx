import React, { useState, useEffect } from 'react';
import { FileText, Download, Send, Eye, Search, AlertTriangle, PenTool, Lock, MessageCircle } from 'lucide-react';
import { storage } from '../data/storage';
import { useDebounce } from '../hooks/useDebounce';
import ResultEntryModal from '../components/ResultEntryModal';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'ready'
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms delay

    const [selectedOrder, setSelectedOrder] = useState(null); // For modal

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = () => {
        const allOrders = storage.getOrders();
        // Sort by date desc
        allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Enrich with Phone
        const patients = storage.getPatients() || [];
        const ptMap = patients.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});
        allOrders.forEach(o => {
            o.patientPhone = ptMap[o.patientId]?.phone || '';
        });

        setOrders(allOrders);
    };

    const handleSaveResult = (orderId, results, isFinalized) => {
        // Update order with results and change status based on finalization
        const status = isFinalized ? 'completed' : 'pending';

        const updatedOrder = storage.updateOrder(orderId, {
            results: results,
            status: status,
            completedAt: isFinalized ? new Date().toISOString() : null
        });

        console.log('Report Update:', updatedOrder);
        setSelectedOrder(null);
        loadOrders(); // Refresh list
    };

    // Filter logic
    const filteredOrders = orders.filter(order => {
        const matchesTab = activeTab === 'pending'
            ? order.status !== 'completed'
            : order.status === 'completed';

        const searchLower = debouncedSearchTerm.toLowerCase();
        const matchesSearch =
            order.id.toLowerCase().includes(searchLower) ||
            order.patientId.toLowerCase().includes(searchLower);

        return matchesTab && matchesSearch;
    });

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Diagnostic Reports</h1>
                    <p className="text-slate-500">View, generate, and distribute patient results.</p>
                </div>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-slate-100">
                    <button
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'pending' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('pending')}
                    >
                        Pending Results ({orders.filter(o => o.status !== 'completed').length})
                    </button>
                    <button
                        className={`flex-1 py-4 text-sm font-medium text-center transition-colors ${activeTab === 'ready' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/10' : 'text-slate-500 hover:text-slate-700'}`}
                        onClick={() => setActiveTab('ready')}
                    >
                        Ready Reports ({orders.filter(o => o.status === 'completed').length})
                    </button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Patient Name or Order ID..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100 min-h-[300px]">
                    {filteredOrders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                            <FileText className="h-12 w-12 mb-3 opacity-20" />
                            <p>No {activeTab} reports found.</p>
                        </div>
                    ) : (
                        filteredOrders.map(order => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                                        <FileText className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-800">{order.patientId}</h3>
                                        <p className="text-xs text-slate-500 flex items-center mt-0.5">
                                            {order.id} • {order.tests.length} Tests
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-xs font-semibold text-slate-500 mb-0.5">{order.status === 'completed' ? 'Completed' : 'Pending'}</p>
                                        <p className="text-[10px] text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {activeTab === 'pending' ? (
                                            <button
                                                onClick={() => setSelectedOrder(order)}
                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center shadow-sm"
                                            >
                                                <PenTool className="h-3 w-3 mr-1.5" />
                                                Enter Results
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => {
                                                        if (!order.patientPhone) {
                                                            alert('Patient phone number not found!');
                                                            return;
                                                        }
                                                        const text = `Dear ${order.patientName}, Please find your test report attached. Tests: ${order.tests?.map(t => t.name).join(', ')}. GreenHealth Lab.`;
                                                        window.open(`https://wa.me/91${order.patientPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors mr-2"
                                                    title="Share on WhatsApp"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors mr-2"
                                                    title="Edit Results"
                                                >
                                                    <PenTool className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => window.open('/print/report', '_blank')}
                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors hidden"
                                                    title="View"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                                <PrintButton order={order} />
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {selectedOrder && (
                <ResultEntryModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onSave={handleSaveResult}
                />
            )}
        </div>
    );
};

// Helper component to use navigate hook for printing
const PrintButton = ({ order }) => {
    // Check if locked
    // Locked if: Payment Status is Pending OR (Balance Due exists and is > 0)
    const isLocked = order.paymentStatus === 'Pending' || (order.balanceDue && order.balanceDue > 0);

    const handleClick = () => {
        if (isLocked) {
            alert(`Cannot download report. Balance Pending: ₹${order.balanceDue || order.totalAmount}`);
            return;
        }

        // Robust Patient Name Logic
        let pid = order.patientId;
        let pname = order.patientName;

        // Legacy Support: Parse ID if it looks like "ID - Name"
        if (!pname && order.patientId.includes(' - ')) {
            const parts = order.patientId.split(' - ');
            pid = parts[0];
            pname = parts[1];
        }

        // Lookup patient details for Age/Gender
        const patients = storage.getPatients();
        const patient = patients.find(p => p.id === pid);

        // Final Fallback for Name
        if (!pname && patient) {
            pname = patient.fullName;
        }

        const reportPayload = {
            id: order.id,
            patientName: pname || 'Unknown',
            patientId: pid,
            age: patient ? patient.age : 'NA',
            gender: patient ? patient.gender : 'NA',
            date: order.completedAt || new Date().toISOString(),
            billingDate: order.createdAt,
            sampleDate: order.collectedAt || order.createdAt,
            tests: order.results || []
        };

        sessionStorage.setItem('print_report_data', JSON.stringify(reportPayload));
        window.open('/print/report', '_blank');
    };

    if (isLocked) {
        return (
            <button
                onClick={handleClick}
                className="p-2 bg-slate-100 text-slate-400 rounded-lg cursor-not-allowed flex items-center gap-2"
                title={`Payment Pending: ₹${order.balanceDue || order.totalAmount}`}
            >
                <Lock className="h-4 w-4" />
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Download / Print"
        >
            <Download className="h-4 w-4" />
        </button>
    );
}

export default Reports;

import React, { useState, useEffect } from 'react';
import { Filter, Search, MoreHorizontal, Clock, CheckCircle, AlertCircle, Beaker, Play, Check } from 'lucide-react';
import { storage } from '../data/storage';

const Samples = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        // Poll for updates or just load once
        const loadOrders = () => {
            const allOrders = storage.getOrders();
            // Sort by newest first
            setOrders(allOrders.reverse());
        };
        loadOrders();
        // Poll every 5s for updates from other tabs
        const interval = setInterval(loadOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStatusUpdate = (orderId, newStatus) => {
        storage.updateOrderStatus(orderId, newStatus);
        // Refresh local state immediately
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            (order.patientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (order.id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesFilter;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'collected': return 'bg-blue-100 text-blue-700';
            case 'processing': return 'bg-purple-100 text-purple-700';
            case 'completed': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    return (
        <div>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sample Architecture</h1>
                    <p className="text-slate-500 mt-1">Track and manage sample status across the lab.</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-white border border-slate-200 rounded-lg p-1 flex">
                        {['all', 'pending', 'collected', 'processing', 'completed'].map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-all ${statusFilter === status ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Stats Overview */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Pending Collection</p>
                    <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status === 'pending').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">In Processing</p>
                    <p className="text-2xl font-bold text-indigo-600">{orders.filter(o => o.status === 'processing').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Completed Today</p>
                    <p className="text-2xl font-bold text-emerald-600">{orders.filter(o => o.status === 'completed').length}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Active</p>
                    <p className="text-2xl font-bold text-slate-800">{orders.filter(o => o.status !== 'completed').length}</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Order ID or Patient Name..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center font-medium">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                    </button>
                </div>

                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tests</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                    No samples found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredOrders.map(order => (
                                <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-slate-700">{order.id}</td>
                                    <td className="px-6 py-4 font-semibold text-slate-800">{order.patientName}</td>
                                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={order.tests?.map(t => t.name).join(', ') || ''}>
                                        {order.tests?.map(t => t.code).join(', ') || 'No Tests'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {new Date(order.createdAt).toLocaleDateString()} <span className="text-xs">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)} capitalize`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {order.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'collected')}
                                                className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200"
                                            >
                                                Receive Sample
                                            </button>
                                        )}
                                        {order.status === 'collected' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'processing')}
                                                className="text-xs font-medium bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg hover:bg-purple-100 transition-colors border border-purple-200"
                                            >
                                                Start Processing
                                            </button>
                                        )}
                                        {order.status === 'processing' && (
                                            <button
                                                onClick={() => handleStatusUpdate(order.id, 'completed')}
                                                className="text-xs font-medium bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
                                            >
                                                Complete & Report
                                            </button>
                                        )}
                                        {order.status === 'completed' && (
                                            <span className="text-xs font-bold text-emerald-600 flex items-center">
                                                <CheckCircle className="h-3 w-3 mr-1" /> Done
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
    );
};

export default Samples;

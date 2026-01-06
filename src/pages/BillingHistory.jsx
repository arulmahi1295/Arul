import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../data/storage';
// SAFE ICONS ONLY (From Finance.jsx)
import { Calendar, Search, Edit2, Download, FileText, DollarSign, CreditCard, MessageCircle } from 'lucide-react';

const BillingHistory = () => {
    console.log("BillingHistory: Component rendering...");
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState({
        totalAmount: 0,
        collected: 0,
        pending: 0,
        count: 0
    });

    useEffect(() => {
        loadDailyData();
    }, [selectedDate]);

    useEffect(() => {
        if (!orders) return;
        try {
            if (searchTerm.trim() === '') {
                setFilteredOrders(orders);
            } else {
                const term = searchTerm.toLowerCase();
                const filtered = orders.filter(o =>
                    (o.patientName && o.patientName.toLowerCase().includes(term)) ||
                    (o.id && o.id.toLowerCase().includes(term)) ||
                    (o.patientId && o.patientId.toLowerCase().includes(term))
                );
                setFilteredOrders(filtered);
            }
        } catch (error) {
            console.error("Filter error:", error);
        }
    }, [searchTerm, orders]);

    const loadDailyData = () => {
        console.log("BillingHistory: Loading data for", selectedDate);
        try {
            const allOrders = storage.getOrders() || [];
            // Filter by selected date (YYYY-MM-DD)
            const dailyOrders = allOrders.filter(o => o.createdAt && o.createdAt.startsWith(selectedDate));

            // Sort by newest first
            dailyOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // Map Phone Numbers
            const pts = storage.getPatients() || [];
            const ptMap = pts.reduce((acc, p) => ({ ...acc, [p.id]: p }), {});

            dailyOrders.forEach(o => {
                o.patientPhone = ptMap[o.patientId]?.phone || '';
            });

            setOrders(dailyOrders);
            setFilteredOrders(dailyOrders);

            // Calculate Summary
            const stats = dailyOrders.reduce((acc, curr) => ({
                totalAmount: acc.totalAmount + (curr.totalAmount || 0),
                collected: acc.collected + (curr.advancePaid || 0),
                // Pending is Balance Due
                pending: acc.pending + (curr.balanceDue || 0),
                count: acc.count + 1
            }), { totalAmount: 0, collected: 0, pending: 0, count: 0 });

            setSummary(stats);
        } catch (error) {
            console.error("Load daily data error:", error);
            setOrders([]);
            setFilteredOrders([]);
        }
    };

    const handleEdit = (order) => {
        if (!order) return;
        if (order.status === 'completed' && window.confirm('This order is marked as completed. Are you sure you want to edit it?')) {
            navigate('/phlebotomy', { state: { editOrderId: order.id } });
        } else if (order.status !== 'completed') {
            navigate('/phlebotomy', { state: { editOrderId: order.id } });
        }
    };

    const handlePrintInvoice = (order) => {
        if (!order) return;
        sessionStorage.setItem('print_invoice_data', JSON.stringify(order));
        window.open('/print/invoice', '_blank');
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Billing History</h1>
                    <p className="text-slate-500 text-sm">View and manage daily billing records</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 font-medium"
                        />
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search Order / Patient..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-full sm:w-64"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <FileText className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Total Bills</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">{summary.count}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">₹{summary.totalAmount}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Collected</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">₹{summary.collected}</p>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
                            <CreditCard className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium text-slate-500">Pending Due</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-800">₹{summary.pending}</p>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">S.No</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Order ID</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Tests</th>
                                <th className="px-6 py-4 text-right">Amount</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {!filteredOrders || filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-12 text-slate-400">
                                        No billing records found for {selectedDate}.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, index) => (
                                    <tr key={order.id || Math.random()} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium text-slate-500">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-500">
                                            {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-slate-800">{order.id}</td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-slate-800">{order.patientName}</p>
                                            <p className="text-xs text-slate-500">{order.patientId}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-slate-600 max-w-[200px] truncate" title={order.tests?.map(t => t.name).join(', ')}>
                                                {order.tests?.map(t => t.name).join(', ') || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm font-bold text-slate-800">₹{order.totalAmount}</span>
                                                {order.balanceDue > 0 && (
                                                    <span className="text-xs text-rose-500 font-medium">Due: ₹{order.balanceDue}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                {order.paymentStatus === 'Paid' ? 'Paid' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        if (!order.patientPhone) {
                                                            alert('Patient phone number not found!');
                                                            return;
                                                        }
                                                        const text = `Dear ${order.patientName}, Please find your invoice attached. Total Amount: ₹${order.totalAmount}. ${order.balanceDue > 0 ? `Balance Due: ₹${order.balanceDue}.` : 'Status: Paid.'} Thank you, GreenHealth Lab.`;
                                                        window.open(`https://wa.me/91${order.patientPhone}?text=${encodeURIComponent(text)}`, '_blank');
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                    title="Send via WhatsApp"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintInvoice(order)}
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Download Invoice"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(order)}
                                                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                                                    title="Edit Bill"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                            </div>
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

export default BillingHistory;

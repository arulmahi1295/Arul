import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar, ArrowUpRight, ArrowDownRight, Search, FileText, Download, Building2, Edit2, Wallet, PieChart as PieIcon, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../data/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group">
        <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            {trend && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    {trendValue}
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
    </div>
);

import { useTests } from '../contexts/TestContext';

const Finance = () => {
    const navigate = useNavigate();
    const { tests: masterTests, packages } = useTests(); // Access master data for backfilling costs
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [profitViewMode, setProfitViewMode] = useState('test'); // 'test' | 'order'
    const [outsourcingStats, setOutsourcingStats] = useState({});
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        pendingAmount: 0,
        avgOrderValue: 0
    });
    const [profitStats, setProfitStats] = useState({
        revenue: 0,
        cost: 0,
        profit: 0,
        margin: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [reportData, setReportData] = useState([]);
    const [dailyRevenueData, setDailyRevenueData] = useState([]);
    const [paymentMixData, setPaymentMixData] = useState([]);
    const [registerDate, setRegisterDate] = useState(new Date().toISOString().split('T')[0]);

    // Outsourcing Feature States
    const [selectedVendor, setSelectedVendor] = useState('All');
    const [selectedOutsourceTests, setSelectedOutsourceTests] = useState([]); // Array of {orderId, testIndex}

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        processReportData();
    }, [orders, activeTab, profitViewMode, masterTests, selectedVendor]);

    const loadData = async () => {
        const allOrders = await storage.getOrders();
        setOrders(allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        // Calculate Stats
        const total = allOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
        const todayStr = new Date().toISOString().split('T')[0];
        const today = allOrders
            .filter(o => o.createdAt.startsWith(todayStr))
            .reduce((acc, order) => acc + (order.totalAmount || 0), 0);
        const pending = allOrders
            .filter(o => o.status !== 'completed' && o.status !== 'cancelled')
            .reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        setStats({
            totalRevenue: total,
            todayRevenue: today,
            pendingAmount: pending,
            avgOrderValue: allOrders.length ? Math.round(total / allOrders.length) : 0
        });

        // Chart Data: Daily Revenue (Last 7 Days)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dailyTotal = allOrders
                .filter(o => o.createdAt.startsWith(dateStr))
                .reduce((acc, o) => acc + (o.totalAmount || 0), 0);

            last7Days.push({
                date: date.toLocaleDateString('en-US', { weekday: 'short' }),
                revenue: dailyTotal
            });
        }
        setDailyRevenueData(last7Days);

        // Chart Data: Payment Mix
        const mix = {};
        allOrders.forEach(o => {
            const mode = o.paymentMode || 'Cash';
            mix[mode] = (mix[mode] || 0) + (o.totalAmount || 0);
        });
        const mixData = Object.keys(mix).map(key => ({ name: key, value: mix[key], color: key === 'Cash' ? '#10B981' : key === 'UPI' ? '#6366f1' : '#F59E0B' }));
        setPaymentMixData(mixData);
    };

    const processReportData = () => {
        let data = [];
        if (activeTab === 'daily') {
            const dailyMap = {};
            orders.forEach(order => {
                const date = order.createdAt.split('T')[0];
                if (!dailyMap[date]) dailyMap[date] = { date, count: 0, revenue: 0, cash: 0, other: 0 };
                dailyMap[date].count++;
                dailyMap[date].revenue += order.totalAmount;
                if (order.paymentMode === 'Cash' || !order.paymentMode) dailyMap[date].cash += order.totalAmount;
                else dailyMap[date].other += order.totalAmount;
            });
            data = Object.values(dailyMap).sort((a, b) => new Date(b.date) - new Date(a.date));
        } else if (activeTab === 'tests') {
            const testMap = {};
            orders.forEach(order => {
                if (order.tests) {
                    order.tests.forEach(test => {
                        if (!testMap[test.code]) testMap[test.code] = { code: test.code, name: test.name, count: 0, revenue: 0 };
                        testMap[test.code].count++;
                        testMap[test.code].revenue += (test.price || 0);
                    });
                }
            });
            data = Object.values(testMap).sort((a, b) => b.revenue - a.revenue);
        } else if (activeTab === 'patients') {
            const patientMap = {};
            orders.forEach(order => {
                const pId = order.patientId.split(' - ')[0] || order.patientId;
                const pName = order.patientName || order.patientId.split(' - ')[1] || 'Unknown';
                if (!patientMap[pId]) patientMap[pId] = { id: pId, name: pName, visits: 0, revenue: 0, lastVisit: '' };
                patientMap[pId].visits++;
                patientMap[pId].revenue += order.totalAmount;
                if (!patientMap[pId].lastVisit || new Date(order.createdAt) > new Date(patientMap[pId].lastVisit)) {
                    patientMap[pId].lastVisit = order.createdAt.split('T')[0];
                }
            });
            data = Object.values(patientMap).sort((a, b) => b.revenue - a.revenue);
        } else if (activeTab === 'trackers') {
            data = orders.filter(o => o.paymentStatus === 'Pending' || o.balanceDue > 0);
        } else if (activeTab === 'outsourcing') {
            // ... (Existing outsourcing logic) ...
            const list = [];
            const partnerStats = {};
            orders.forEach(o => {
                if (!o.tests) return;
                const isOutsourcedOrder = o.processingMode === 'Outsource';
                const partner = o.outsourceLab;
                o.tests.forEach((t, index) => {
                    if ((isOutsourcedOrder && partner) || (t.labPartner && t.labPartner !== 'In-House')) {
                        let cost = t.l2lPrice;
                        // Backfill if missing
                        if (cost === undefined || cost === null) {
                            const tDef = masterTests.find(mt => mt.code === t.code || mt.name === t.name);
                            cost = tDef ? (parseFloat(tDef.l2lPrice) || 0) : 0;
                        }
                        const price = t.price || 0;
                        const margin = price - cost;
                        list.push({ orderId: o.id, patientName: o.patientName || o.patientId, testName: t.name, labPartner: partner || t.labPartner, cost, price, margin, status: t.settlementStatus || 'Pending', testIndex: index, sentDate: o.accessionDate || o.createdAt });
                        const pName = partner || t.labPartner;
                        if (!partnerStats[pName]) partnerStats[pName] = { due: 0, paid: 0, margin: 0 };
                        if (t.settlementStatus === 'Settled') partnerStats[pName].paid += cost;
                        else partnerStats[pName].due += cost;
                        partnerStats[pName].margin += margin;
                    }
                });
            });
            setOutsourcingStats(partnerStats);
            data = list.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
            if (selectedVendor !== 'All') {
                data = data.filter(d => d.labPartner === selectedVendor);
            }
        } else if (activeTab === 'profit') {
            // PROFIT CALCULATION LOGIC
            let totalRev = 0;
            let totalCost = 0;

            if (profitViewMode === 'test') {
                const testMap = {};
                orders.forEach(order => {
                    if (order.status === 'cancelled') return;
                    (order.tests || []).forEach(test => {
                        let cost = test.l2lPrice;
                        // Backfill cost if missing from historical orders
                        if (cost === undefined || cost === null) {
                            const masterTest = masterTests.find(mt => mt.code === test.code);
                            cost = masterTest ? masterTest.l2lPrice : 0;
                        }

                        // Handle Package Cost (if not already summed in test)
                        if ((test.type === 'package' || !cost) && packages) {
                            const foundPkg = packages.find(p => p.id === test.id || p.name === test.name);
                            if (foundPkg && foundPkg.tests) {
                                // Calculate cost from package definition
                                const pkgCost = foundPkg.tests.reduce((sum, tId) => {
                                    const tDef = masterTests.find(mt => mt.id === tId || mt.code === tId);
                                    return sum + (tDef ? (parseFloat(tDef.l2lPrice) || 0) : 0);
                                }, 0);
                                if (pkgCost > 0) cost = pkgCost;
                            }
                        }

                        const price = test.price || 0;
                        const profit = price - (cost || 0);

                        if (!testMap[test.code]) {
                            testMap[test.code] = {
                                code: test.code,
                                name: test.name,
                                count: 0,
                                revenue: 0,
                                cost: 0,
                                profit: 0
                            };
                        }
                        testMap[test.code].count++;
                        testMap[test.code].revenue += price;
                        testMap[test.code].cost += (cost || 0);
                        testMap[test.code].profit += profit;

                        totalRev += price;
                        totalCost += (cost || 0);
                    });
                });
                data = Object.values(testMap).sort((a, b) => b.profit - a.profit);
            } else {
                // By Order
                data = orders.filter(o => o.status !== 'cancelled').map(order => {
                    let orderCost = 0;
                    let orderRev = 0; // Recalculate from tests to be precise with individual margins

                    (order.tests || []).forEach(test => {
                        let cost = test.l2lPrice;
                        if (cost === undefined || cost === null) {
                            const masterTest = masterTests.find(mt => mt.code === test.code);
                            cost = masterTest ? masterTest.l2lPrice : 0;
                        }

                        // Package Cost Fallback for Orders View
                        if ((test.type === 'package' || !cost) && packages) {
                            const foundPkg = packages.find(p => p.id === test.id || p.name === test.name);
                            if (foundPkg && foundPkg.tests) {
                                const pkgCost = foundPkg.tests.reduce((sum, tId) => {
                                    const tDef = masterTests.find(mt => mt.id === tId || mt.code === tId);
                                    return sum + (tDef ? (parseFloat(tDef.l2lPrice) || 0) : 0);
                                }, 0);
                                if (pkgCost > 0) cost = pkgCost;
                            }
                        }

                        orderCost += (cost || 0);
                        orderRev += (test.price || 0);
                    });

                    // Adjust for order-level discount if tests sum matches subtotal?
                    // For simplicity, we'll use order.totalAmount as Revenue, and scale cost?
                    // Better technique: Revenue = order.totalAmount (actual billed).
                    // Cost = Sum of Test Costs.

                    const actualRevenue = order.totalAmount || 0;
                    const profit = actualRevenue - orderCost;

                    totalRev += actualRevenue;
                    totalCost += orderCost;

                    return {
                        id: order.id,
                        patientName: order.patientName || order.patientId,
                        date: order.createdAt,
                        testCount: (order.tests || []).length,
                        revenue: actualRevenue,
                        cost: orderCost,
                        profit: profit,
                        margin: actualRevenue > 0 ? Math.round((profit / actualRevenue) * 100) : 0
                    };
                }).sort((a, b) => new Date(b.date) - new Date(a.date));
            }

            setProfitStats({
                revenue: totalRev,
                cost: totalCost,
                profit: totalRev - totalCost,
                margin: totalRev > 0 ? Math.round(((totalRev - totalCost) / totalRev) * 100) : 0
            });
        }
        setReportData(data);
    };

    const handleSettleTest = async (orderId, testIndex) => {
        if (!confirm('Mark this test as settled with the partner?')) return;
        try {
            const order = orders.find(o => o.id === orderId);
            if (!order) return;

            const docId = order.firebaseId || orderId;
            const orderRef = doc(db, 'orders', docId);

            const updatedTests = [...order.tests];
            updatedTests[testIndex].settlementStatus = 'Settled';
            updatedTests[testIndex].settlementDate = new Date().toISOString();

            await updateDoc(orderRef, { tests: updatedTests });
            await loadData(); // Refresh
        } catch (error) {
            console.error("Error settling test:", error);
            alert('Failed to update status');
        }
    };

    const handleBulkSettle = async () => {
        if (selectedOutsourceTests.length === 0) return;
        if (!confirm(`Mark ${selectedOutsourceTests.length} tests as settled?`)) return;

        try {
            // Group by Order ID to minimize writes
            const updatesByOrder = {};
            selectedOutsourceTests.forEach(({ orderId, testIndex }) => {
                if (!updatesByOrder[orderId]) updatesByOrder[orderId] = [];
                updatesByOrder[orderId].push(testIndex);
            });

            const promises = Object.keys(updatesByOrder).map(async (orderId) => {
                const order = orders.find(o => o.id === orderId);
                if (!order) return;

                const docId = order.firebaseId || orderId;
                const orderRef = doc(db, 'orders', docId);

                const updatedTests = [...order.tests];
                updatesByOrder[orderId].forEach(idx => {
                    if (updatedTests[idx]) {
                        updatedTests[idx].settlementStatus = 'Settled';
                        updatedTests[idx].settlementDate = new Date().toISOString();
                    }
                });
                return updateDoc(orderRef, { tests: updatedTests });
            });

            await Promise.all(promises);
            await loadData();
            setSelectedOutsourceTests([]);
            alert('Bulk settlement complete!');
        } catch (error) {
            console.error("Bulk settle error:", error);
            alert('Failed to complete bulk settlement.');
        }
    };

    const toggleSelectTest = (orderId, testIndex) => {
        const id = `${orderId}-${testIndex}`;
        const exists = selectedOutsourceTests.find(x => x.id === id);

        if (exists) {
            setSelectedOutsourceTests(prev => prev.filter(x => x.id !== id));
        } else {
            setSelectedOutsourceTests(prev => [...prev, { id, orderId, testIndex }]);
        }
    };

    const toggleSelectAll = () => {
        if (selectedOutsourceTests.length === reportData.length) {
            setSelectedOutsourceTests([]);
        } else {
            // Select all currently visible in reportData (respects filter)
            const all = reportData
                .filter(row => row.status !== 'Settled')
                .map(row => ({ id: `${row.orderId}-${row.testIndex}`, orderId: row.orderId, testIndex: row.testIndex }));
            setSelectedOutsourceTests(all);
        }
    };

    const handleExport = () => {
        let headers = [];
        let dataRows = [];
        let filename = `report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;

        if (activeTab === 'profit') {
            if (profitViewMode === 'test') {
                headers = ['Test Code', 'Test Name', 'Count', 'Total Revenue', 'Total Cost', 'Gross Profit', 'Margin %'];
                dataRows = reportData.map(d => [
                    d.code, d.name, d.count, d.revenue, d.cost, d.profit,
                    d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) + '%' : '0%'
                ]);
            } else {
                headers = ['Order ID', 'Patient', 'Date', 'Tests', 'Revenue', 'Est. Cost', 'Gross Profit', 'Margin %'];
                dataRows = reportData.map(d => [
                    d.id, d.patientName, new Date(d.date).toLocaleDateString(), d.testCount, d.revenue, d.cost, d.profit, d.margin + '%'
                ]);
            }
        } else if (activeTab === 'daily') {
            // ... existing ... 
            headers = ['Date', 'Order Count', 'Total Revenue', 'Cash Revenue', 'Other Revenue'];
            dataRows = reportData.map(d => [d.date, d.count, d.revenue, d.cash, d.other]);
        } else if (activeTab === 'tests') {
            // ... existing ...
            headers = ['Test Code', 'Test Name', 'Quantity Sold', 'Total Revenue'];
            dataRows = reportData.map(d => [d.code, d.name, d.count, d.revenue]);
        } else if (activeTab === 'patients') {
            headers = ['Patient ID', 'Name', 'Visit Count', 'Total Spent', 'Last Visit'];
            dataRows = reportData.map(d => [d.id, d.name, d.visits, d.revenue, d.lastVisit]);
        } else if (activeTab === 'trackers') {
            headers = ['Order ID', 'Patient', 'Date', 'Payment Status', 'Due Amount'];
            dataRows = reportData.map(d => [d.id, d.patientId, d.createdAt, 'Pending', d.totalAmount]);
        } else if (activeTab === 'outsourcing') {
            headers = ['Order ID', 'Patient', 'Test', 'Partner', 'Sent Date', 'MRP', 'Cost', 'Margin', 'Status'];
            dataRows = reportData.map(d => [d.orderId, d.patientName, d.testName, d.labPartner, new Date(d.sentDate).toLocaleDateString(), d.price, d.cost, d.margin, d.status]);
        } else {
            headers = ['Order ID', 'Patient', 'Date', 'Payment Mode', 'Status', 'Amount'];
            dataRows = orders.map(o => [o.id, o.patientId, o.createdAt, o.paymentMode || 'Cash', o.status, o.totalAmount]);
            filename = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        // ... (Existing Branding & Write Logic) ...
        const brandingRows = [
            ['GreenHealth Lab'],
            ['37/A 15th Cross 16th Main Road BTM 2nd Stage Bengaluru 560076'],
            ['Phone: +91 83100 22139 | GSTIN: 22AAAAA0000A1Z5'],
            ['Report Generated: ' + new Date().toLocaleString()],
            []
        ];
        const finalData = [...brandingRows, headers, ...dataRows];
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        const wscols = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
        XLSX.writeFile(wb, filename);
    };

    // ... (Existing handlers: handleClearDue, handleCancelOrder, handleDownloadReceipt, handleSettleTest, StatusChip) ...
    const handleClearDue = async (order) => { /*...*/ if (confirm(`Confirm: Mark Order ${order.id} as PAID and clear due amount?`)) { const updated = { ...order, paymentStatus: 'Paid', balanceDue: 0, advancePaid: order.totalAmount, status: order.status === 'cancelled' ? 'pending' : order.status }; await storage.updateOrder(order.id, updated); loadData(); } };
    const handleCancelOrder = async (order) => { /*...*/ if (confirm(`Are you sure you want to CANCEL Order ${order.id}? This action cannot be easily undone.`)) { const updated = { ...order, status: 'cancelled', paymentStatus: 'Void', balanceDue: 0 }; await storage.updateOrder(order.id, updated); loadData(); } };
    const handleDownloadReceipt = (order) => { sessionStorage.setItem('print_invoice_data', JSON.stringify(order)); window.open('/print/invoice', '_blank'); };

    const StatusChip = ({ status }) => { const styles = { completed: 'bg-emerald-100 text-emerald-700', pending: 'bg-amber-100 text-amber-700', processing: 'bg-blue-100 text-blue-700', cancelled: 'bg-rose-100 text-rose-700', 'payment-due': 'bg-orange-100 text-orange-700 font-bold whitespace-nowrap' }; const displayStatus = status === 'payment-due' ? 'PAYMENT DUE' : status; return (<span className={`inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${styles[status] || styles['pending']}`}> {displayStatus} </span>); };


    const filteredTransactions = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.patientName && o.patientName.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-8">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Financial Hub</h1>
                    <p className="text-slate-500">Revenue, expense tracking, and settlement management.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExport} className="bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 px-4 py-2 rounded-xl text-sm font-medium shadow-sm transition-all flex items-center">
                        <Download className="h-4 w-4 mr-2" /> Reports
                    </button>
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['Overview', 'Profit', 'Daily', 'Tests', 'Trackers', 'Outsourcing'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab.toLowerCase())}
                                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.toLowerCase() ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Quick Stats */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon={DollarSign} color="bg-gradient-to-br from-emerald-500 to-teal-600" trend="up" trendValue="12%" />
                    <StatCard title="Today's Revenue" value={`₹${stats.todayRevenue.toLocaleString()}`} icon={Calendar} color="bg-gradient-to-br from-blue-500 to-indigo-600" subtitle="Daily performance" />
                    <StatCard title="Pending (Est.)" value={`₹${stats.pendingAmount.toLocaleString()}`} icon={CreditCard} color="bg-gradient-to-br from-amber-500 to-orange-600" subtitle="Unrealized revenue" />
                    <StatCard title="Avg. Order" value={`₹${stats.avgOrderValue.toLocaleString()}`} icon={TrendingUp} color="bg-gradient-to-br from-violet-500 to-purple-600" subtitle="Per patient" />
                </div>
            )}

            {activeTab === 'profit' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Gross Profit</p>
                            <h3 className="text-3xl font-bold text-emerald-600 mt-2">₹{profitStats.profit.toLocaleString()}</h3>
                            <p className="text-xs text-slate-400 mt-1">Total revenue minus L2L costs</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Net Margin</p>
                            <h3 className="text-3xl font-bold text-indigo-600 mt-2">{profitStats.margin}%</h3>
                            <p className="text-xs text-slate-400 mt-1">Average profitability across orders</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-2">₹{profitStats.revenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total L2L Cost</p>
                            <h3 className="text-2xl font-bold text-rose-600 mt-2">₹{profitStats.cost.toLocaleString()}</h3>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setProfitViewMode('test')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${profitViewMode === 'test' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>By Test</button>
                        <button onClick={() => setProfitViewMode('order')} className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${profitViewMode === 'order' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>By Order</button>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    {profitViewMode === 'test' ? (
                                        <tr>
                                            <th className="px-6 py-4">Test Information</th>
                                            <th className="px-6 py-4 text-center">Qty Sold</th>
                                            <th className="px-6 py-4 text-right">Revenue</th>
                                            <th className="px-6 py-4 text-right">L2L Cost</th>
                                            <th className="px-6 py-4 text-right">Gross Profit</th>
                                            <th className="px-6 py-4 text-right">Margin</th>
                                        </tr>
                                    ) : (
                                        <tr>
                                            <th className="px-6 py-4">Order Details</th>
                                            <th className="px-6 py-4 text-center">Tests</th>
                                            <th className="px-6 py-4 text-right">Revenue</th>
                                            <th className="px-6 py-4 text-right">Est. Cost</th>
                                            <th className="px-6 py-4 text-right">Gross Profit</th>
                                            <th className="px-6 py-4 text-right">Margin</th>
                                        </tr>
                                    )}
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {reportData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                            {profitViewMode === 'test' ? (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <p className="font-bold text-slate-800 text-sm">{row.name}</p>
                                                        <p className="text-xs font-mono text-slate-500">{row.code}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-slate-700">{row.count}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">₹{row.revenue.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">₹{row.cost.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">₹{row.profit.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${row.revenue > 0 && (row.profit / row.revenue) > 0.4 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {row.revenue > 0 ? Math.round((row.profit / row.revenue) * 100) : 0}%
                                                        </span>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                                {row.patientName.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-slate-800 text-sm">{row.patientName}</p>
                                                                <p className="text-xs text-slate-400">{row.id} • {new Date(row.date).toLocaleDateString()}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-medium text-slate-700">{row.testCount}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">₹{row.revenue.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-medium text-rose-600">₹{row.cost.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">₹{row.profit.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-right">
                                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${row.margin > 40 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {row.margin}%
                                                        </span>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Transaction List */}
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
                        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
                            <h2 className="font-bold text-slate-800 text-lg">Recent Transactions</h2>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    className="pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none transition-all w-48"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">ID</th>
                                        <th className="px-6 py-4">Patient</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredTransactions.slice(0, 8).map(order => (
                                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{order.id}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">{order.patientName || order.patientId}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td className="px-6 py-4"><StatusChip status={(order.balanceDue > 0 || order.paymentStatus === 'Pending') && order.status !== 'cancelled' ? 'payment-due' : order.status} /></td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-800">₹{order.totalAmount}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-1">
                                                    <button onClick={() => handleDownloadReceipt(order)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors"><Download className="h-4 w-4" /></button>
                                                    {order.balanceDue > 0 && <button onClick={() => handleClearDue(order)} className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"><CreditCard className="h-4 w-4" /></button>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Revenue Charts */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Revenue Trend</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailyRevenueData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                        <defs>
                                            <filter id="glowSmall" x="-50%" y="-50%" width="200%" height="200%">
                                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                                <feMerge>
                                                    <feMergeNode in="coloredBlur" />
                                                    <feMergeNode in="SourceGraphic" />
                                                </feMerge>
                                            </filter>
                                            <linearGradient id="colorRevSmall" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans', opacity: 0.7 }}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '12px',
                                                border: '1px solid rgba(255,255,255,0.4)',
                                                boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                                                fontFamily: 'Plus Jakarta Sans',
                                                padding: '8px 12px'
                                            }}
                                            itemStyle={{ color: '#0f766e', fontWeight: 700, fontSize: '11px' }}
                                            labelStyle={{ display: 'none' }}
                                            cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#14b8a6"
                                            fillOpacity={1}
                                            fill="url(#colorRevSmall)"
                                            strokeWidth={2}
                                            filter="url(#glowSmall)"
                                            activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff', fill: '#14b8a6' }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wide">Payment Modes</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={paymentMixData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                                            {paymentMixData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color || '#94a3b8'} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                    {activeTab === 'outsourcing' && (
                        <div className="flex items-center justify-between p-4 border-b border-slate-50 bg-slate-50/50">
                            <div className="flex items-center gap-4">
                                <h3 className="font-bold text-slate-700">Outsourcing Management</h3>
                                <select
                                    value={selectedVendor}
                                    onChange={(e) => setSelectedVendor(e.target.value)}
                                    className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                                >
                                    <option value="All">All Vendors</option>
                                    {Object.keys(outsourcingStats).map(vendor => (
                                        <option key={vendor} value={vendor}>{vendor}</option>
                                    ))}
                                </select>
                            </div>
                            {selectedOutsourceTests.length > 0 && (
                                <button
                                    onClick={handleBulkSettle}
                                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Bulk Settle ({selectedOutsourceTests.length})
                                </button>
                            )}
                        </div>
                    )}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    {activeTab === 'daily' && (<><th className="px-6 py-4">Date</th><th className="px-6 py-4">Count</th><th className="px-6 py-4 text-right">Total Revenue</th></>)}
                                    {activeTab === 'tests' && (<><th className="px-6 py-4">Test Code</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Qty</th><th className="px-6 py-4 text-right">Revenue</th></>)}
                                    {activeTab === 'patients' && (<><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Visits</th><th className="px-6 py-4 text-right">Spent</th></>)}
                                    {activeTab === 'trackers' && (<><th className="px-6 py-4">Order ID</th><th className="px-6 py-4">Patient</th><th className="px-6 py-4">Date</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Due Amount</th></>)}
                                    {activeTab === 'outsourcing' && (<>
                                        <th className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                onChange={toggleSelectAll}
                                                checked={reportData.length > 0 && selectedOutsourceTests.length === reportData.filter(d => d.status !== 'Settled').length}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="px-6 py-4">Test Info</th><th className="px-6 py-4 text-right">MRP</th><th className="px-6 py-4 text-right">L2L</th><th className="px-6 py-4 text-right">Margin</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Action</th>
                                    </>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reportData.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-slate-400">No data available.</td></tr> : reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        {activeTab === 'daily' && (<><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.date}</td><td className="px-6 py-4 text-sm text-slate-600">{row.count}</td><td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">₹{row.revenue}</td></>)}
                                        {activeTab === 'tests' && (<><td className="px-6 py-4 text-xs font-mono text-slate-500">{row.code}</td><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.name}</td><td className="px-6 py-4 text-sm text-slate-600">{row.count}</td><td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td></>)}
                                        {activeTab === 'patients' && (<><td className="px-6 py-4 text-xs font-mono text-slate-500">{row.id}</td><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.name}</td><td className="px-6 py-4 text-sm text-slate-600">{row.visits}</td><td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td></>)}
                                        {activeTab === 'trackers' && (<><td className="px-6 py-4 text-xs font-mono text-slate-500">{row.id}</td><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.patientName || row.patientId}</td><td className="px-6 py-4 text-sm text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</td><td className="px-6 py-4"><span className="bg-amber-100 text-amber-700 px-2 py-1 rounded text-[10px] font-bold uppercase">Pending</span></td><td className="px-6 py-4 text-sm font-bold text-rose-600 text-right">₹{row.balanceDue || row.totalAmount}</td></>)}
                                        {activeTab === 'outsourcing' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    {row.status !== 'Settled' && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedOutsourceTests.some(x => x.id === `${row.orderId}-${row.testIndex}`)}
                                                            onChange={() => toggleSelectTest(row.orderId, row.testIndex)}
                                                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm font-bold text-slate-800">{row.testName}</div>
                                                    <div className="text-xs text-slate-500">{row.labPartner} | {new Date(row.sentDate).toLocaleDateString()}</div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-600 text-right">₹{row.price}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-rose-600 text-right">₹{row.cost}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">₹{row.margin}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${row.status === 'Settled' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {row.status !== 'Settled' && (
                                                        <button
                                                            onClick={() => handleSettleTest(row.orderId, row.testIndex)}
                                                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors font-semibold"
                                                        >
                                                            Settle
                                                        </button>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;

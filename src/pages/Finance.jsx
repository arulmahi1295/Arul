import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar, ArrowUpRight, ArrowDownRight, Search, FileText, Download, Building2, Edit2, Wallet, PieChart as PieIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../data/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import * as XLSX from 'xlsx';

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

const Finance = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [outsourcingStats, setOutsourcingStats] = useState({});
    const [stats, setStats] = useState({
        totalRevenue: 0,
        todayRevenue: 0,
        pendingAmount: 0,
        avgOrderValue: 0
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [reportData, setReportData] = useState([]);
    const [dailyRevenueData, setDailyRevenueData] = useState([]);
    const [paymentMixData, setPaymentMixData] = useState([]);
    const [registerDate, setRegisterDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        processReportData();
    }, [orders, activeTab]);

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
            .reduce((acc, order) => acc + (order.totalAmount || 0), 0); // Simplified estimate

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
        } else if (activeTab === 'advance') {
            data = orders.filter(o => o.advancePaid && o.advancePaid > 0);
        } else if (activeTab === 'outsourcing') {
            const list = [];
            const partnerStats = {};
            orders.forEach(o => {
                if (!o.tests) return;
                const isOutsourcedOrder = o.processingMode === 'Outsource';
                const partner = o.outsourceLab;

                o.tests.forEach((t, index) => {
                    // Logic: If order is outsourced, OR if individual test has labPartner override (future proofing)
                    if (isOutsourcedOrder && partner) {
                        const cost = t.l2lPrice || 0;
                        const price = t.price || 0;
                        const margin = price - cost;

                        list.push({
                            orderId: o.id,
                            patientName: o.patientName || o.patientId,
                            testName: t.name,
                            labPartner: partner,
                            cost: cost,
                            price: price,
                            margin: margin,
                            status: t.settlementStatus || 'Pending',
                            testIndex: index,
                            sentDate: o.accessionDate || o.createdAt
                        });

                        if (!partnerStats[partner]) partnerStats[partner] = { due: 0, paid: 0, margin: 0 };

                        if (t.settlementStatus === 'Settled') {
                            partnerStats[partner].paid += cost;
                        } else {
                            partnerStats[partner].due += cost;
                        }
                        partnerStats[partner].margin += margin;
                    }
                });
            });
            setOutsourcingStats(partnerStats);
            data = list.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate));
        }
        setReportData(data);
    };

    const handleDailyRegisterExport = async () => {
        const allPatients = await storage.getPatients();
        const selectedDateStr = registerDate;
        const dailyPatients = allPatients.filter(p => p.createdAt && p.createdAt.startsWith(selectedDateStr));
        if (dailyPatients.length === 0) { alert(`No patients found registered on ${selectedDateStr}`); return; }
        const exportData = dailyPatients.map(p => ({
            'Patient ID': p.id,
            'Full Name': p.fullName,
            'Age': p.age,
            'Gender': p.gender,
            'DOB': p.dob,
            'Phone': p.phone,
            'Email': p.email,
            'Address': p.address,
            'Blood Group': p.bloodGroup,
            'Medical Conditions': p.medicalConditions,
            'Current Medications': p.medications,
            'Allergies': p.allergies,
            'Registration Date': new Date(p.createdAt).toLocaleString(),
            'Payment Mode': p.paymentMode
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wscols = Object.keys(exportData[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Daily Register");
        XLSX.writeFile(wb, `Patient_Register_${selectedDateStr}.xlsx`);
    };

    const handleOutsourcingExport = async () => {
        const allOrders = await storage.getOrders();
        const selectedDateStr = registerDate;
        const outsourcedTests = [];
        allOrders.forEach(o => {
            if (!o.tests) return;
            const isOutsourcedOrder = o.processingMode === 'Outsource';
            const partnerName = o.outsourceLab;

            o.tests.forEach(test => {
                // Check if order is outsourced OR individual test (legacy support or future proof)
                const isOutsourced = (isOutsourcedOrder && partnerName) || (test.labPartner && test.labPartner !== 'In-House');

                const dateToCompare = o.accessionDate || o.createdAt;
                if (isOutsourced && dateToCompare && dateToCompare.startsWith(selectedDateStr)) {
                    const price = test.price || 0;
                    const cost = test.l2lPrice || 0;

                    outsourcedTests.push({
                        orderId: o.id,
                        patientId: o.patientId,
                        testName: test.name,
                        testCode: test.code,
                        labPartner: partnerName || test.labPartner,
                        sentDate: new Date(dateToCompare).toLocaleString(),
                        status: test.settlementStatus || 'Pending', // Use test level status if available
                        price: price,
                        cost: cost,
                        margin: price - cost
                    });
                }
            });
        });
        if (outsourcedTests.length === 0) { alert(`No outsourced tests found for ${selectedDateStr}`); return; }
        const exportData = outsourcedTests.map(t => ({
            'Order ID': t.orderId,
            'Patient': t.patientId,
            'Test Name': t.testName,
            'Lab Partner': t.labPartner,
            'Sent Date': t.sentDate,
            'Status': t.status,
            'MRP': t.price,
            'L2L Cost': t.cost,
            'Margin': t.margin
        }));
        const ws = XLSX.utils.json_to_sheet(exportData);
        const wscols = Object.keys(exportData[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Outsourcing");
        XLSX.writeFile(wb, `Outsourcing_Report_${selectedDateStr}.xlsx`);
    };

    const handleMasterExport = async () => {
        const allOrders = await storage.getOrders();
        const allPatients = await storage.getPatients();
        if (allOrders.length === 0) { alert('No data to export.'); return; }
        const data = allOrders.map(order => {
            const patient = allPatients.find(p => p.id === order.patientId) || {};
            const patientName = order.patientName || patient.fullName || order.patientId;
            return {
                'Order ID': order.id,
                'Date': new Date(order.createdAt).toLocaleDateString(),
                'Time': new Date(order.createdAt).toLocaleTimeString(),
                'Patient Name': patientName,
                'Patient ID': order.patientId,
                'Phone': patient.phone || '',
                'Gender': patient.gender || order.patientGender || '',
                'Age': patient.age || order.patientAge || '',
                'Tests': order.tests ? order.tests.map(t => t.name).join(', ') : '',
                'Total Amount': order.totalAmount,
                'Discount': order.discount || 0,
                'Net Amount': (order.totalAmount || 0) - (order.discount || 0),
                'Paid Amount': order.advancePaid || (order.paymentStatus === 'Paid' ? order.totalAmount : 0),
                'Balance Due': order.balanceDue || 0,
                'Payment Mode': order.paymentMode || 'Cash',
                'Status': order.status,
                'Referred By': order.doctor || ''
            };
        });
        const ws = XLSX.utils.json_to_sheet(data);
        const wscols = Object.keys(data[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Master Billing Data");
        XLSX.writeFile(wb, `Master_Billing_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleExport = () => {
        let headers = [];
        let dataRows = [];
        let filename = `report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;

        if (activeTab === 'daily') {
            headers = ['Date', 'Order Count', 'Total Revenue', 'Cash Revenue', 'Other Revenue'];
            dataRows = reportData.map(d => [d.date, d.count, d.revenue, d.cash, d.other]);
        } else if (activeTab === 'tests') {
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
        const brandingRows = [
            ['GreenHealth Lab'],
            ['123 Health Avenue, Medical District'],
            ['Phone: +1 (555) 123-4567 | GSTIN: 22AAAAA0000A1Z5'],
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

    const handleClearDue = async (order) => {
        if (confirm(`Confirm: Mark Order ${order.id} as PAID and clear due amount?`)) {
            const updated = {
                ...order,
                paymentStatus: 'Paid',
                balanceDue: 0,
                advancePaid: order.totalAmount,
                status: order.status === 'cancelled' ? 'pending' : order.status
            };
            await storage.updateOrder(order.id, updated);
            loadData();
        }
    };

    const handleCancelOrder = async (order) => {
        if (confirm(`Are you sure you want to CANCEL Order ${order.id}? This action cannot be easily undone.`)) {
            const updated = {
                ...order,
                status: 'cancelled',
                paymentStatus: 'Void',
                balanceDue: 0
            };
            await storage.updateOrder(order.id, updated);
            loadData();
        }
    };
    const handleDownloadReceipt = (order) => {
        sessionStorage.setItem('print_invoice_data', JSON.stringify(order));
        window.open('/print/invoice', '_blank');
    };

    const handleSettleTest = async (orderId, testIndex) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) return;
        if (confirm(`Confirm settlement for Order ${orderId}: ${order.tests[testIndex].name}?`)) {
            const updatedTests = [...order.tests];
            updatedTests[testIndex] = {
                ...updatedTests[testIndex],
                settlementStatus: 'Settled',
                minItemStock: undefined
            };
            await storage.updateOrder(orderId, { tests: updatedTests });
            loadData();
        }
    };

    const StatusChip = ({ status }) => {
        const styles = {
            completed: 'bg-emerald-100 text-emerald-700',
            pending: 'bg-amber-100 text-amber-700',
            processing: 'bg-blue-100 text-blue-700',
            cancelled: 'bg-rose-100 text-rose-700',
            'payment-due': 'bg-orange-100 text-orange-700 font-bold whitespace-nowrap'
        };
        const displayStatus = status === 'payment-due' ? 'PAYMENT DUE' : status;
        return (
            <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${styles[status] || styles['pending']}`}>
                {displayStatus}
            </span>
        );
    };

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
                        {['Overview', 'Daily', 'Tests', 'Trackers', 'Outsourcing'].map(tab => (
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
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    {activeTab === 'daily' && (<><th className="px-6 py-4">Date</th><th className="px-6 py-4">Count</th><th className="px-6 py-4 text-right">Total Revenue</th></>)}
                                    {activeTab === 'tests' && (<><th className="px-6 py-4">Test Code</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Qty</th><th className="px-6 py-4 text-right">Revenue</th></>)}
                                    {activeTab === 'patients' && (<><th className="px-6 py-4">ID</th><th className="px-6 py-4">Name</th><th className="px-6 py-4">Visits</th><th className="px-6 py-4 text-right">Spent</th></>)}
                                    {activeTab === 'outsourcing' && (<><th className="px-6 py-4">Test Info</th><th className="px-6 py-4 text-right">MRP</th><th className="px-6 py-4 text-right">L2L</th><th className="px-6 py-4 text-right">Margin</th><th className="px-6 py-4 text-center">Status</th><th className="px-6 py-4 text-right">Action</th></>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {reportData.length === 0 ? <tr><td colSpan="6" className="text-center py-8 text-slate-400">No data available.</td></tr> : reportData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                        {activeTab === 'daily' && (<><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.date}</td><td className="px-6 py-4 text-sm text-slate-600">{row.count}</td><td className="px-6 py-4 text-sm font-bold text-emerald-600 text-right">₹{row.revenue}</td></>)}
                                        {activeTab === 'tests' && (<><td className="px-6 py-4 text-xs font-mono text-slate-500">{row.code}</td><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.name}</td><td className="px-6 py-4 text-sm text-slate-600">{row.count}</td><td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td></>)}
                                        {activeTab === 'patients' && (<><td className="px-6 py-4 text-xs font-mono text-slate-500">{row.id}</td><td className="px-6 py-4 text-sm font-medium text-slate-700">{row.name}</td><td className="px-6 py-4 text-sm text-slate-600">{row.visits}</td><td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td></>)}
                                        {activeTab === 'outsourcing' && (
                                            <>
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

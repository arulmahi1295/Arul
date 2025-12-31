import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, Calendar, ArrowUpRight, ArrowDownRight, Search, FileText, Download, Building2 } from 'lucide-react';
import { storage } from '../data/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import * as XLSX from 'xlsx';

const Finance = () => {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
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

    const loadData = () => {
        const allOrders = storage.getOrders();
        setOrders(allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        // Calculate Stats
        const total = allOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        const todayStr = new Date().toISOString().split('T')[0];
        const today = allOrders
            .filter(o => o.createdAt.startsWith(todayStr))
            .reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        // Assume 'pending' status means payment might not be fully reconciled or just track 'potential' vs 'realized'
        // For this LIS, let's treat all as Revenue but track 'Pending Processing' as maybe pending payment
        const pending = allOrders
            .filter(o => o.status !== 'completed')
            .reduce((acc, order) => acc + (order.totalAmount || 0), 0);

        setStats({
            totalRevenue: total,
            todayRevenue: today,
            pendingAmount: pending,
            avgOrderValue: allOrders.length ? Math.round(total / allOrders.length) : 0
        });

        // Prepare Chart Data
        // 1. Daily Revenue (Last 7 Days)
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

        // 2. Payment Mix
        const mix = {};
        allOrders.forEach(o => {
            const mode = o.paymentMode || 'Cash';
            mix[mode] = (mix[mode] || 0) + (o.totalAmount || 0);
        });
        const mixData = Object.keys(mix).map(key => ({ name: key, value: mix[key] }));
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
                order.tests.forEach(test => {
                    if (!testMap[test.code]) testMap[test.code] = { code: test.code, name: test.name, count: 0, revenue: 0 };
                    testMap[test.code].count++;
                    testMap[test.code].revenue += test.price;
                });
            });
            data = Object.values(testMap).sort((a, b) => b.revenue - a.revenue);
        } else if (activeTab === 'patients') {
            const patientMap = {};
            orders.forEach(order => {
                const pId = order.patientId.split(' - ')[0] || order.patientId;
                const pName = order.patientId.split(' - ')[1] || 'Unknown';
                if (!patientMap[pId]) patientMap[pId] = { id: pId, name: pName, visits: 0, revenue: 0, lastVisit: '' };
                patientMap[pId].visits++;
                patientMap[pId].revenue += order.totalAmount;
                if (!patientMap[pId].lastVisit || new Date(order.createdAt) > new Date(patientMap[pId].lastVisit)) {
                    patientMap[pId].lastVisit = order.createdAt.split('T')[0];
                }
            });
            data = Object.values(patientMap).sort((a, b) => b.revenue - a.revenue);
        } else if (activeTab === 'trackers') {
            // We'll return an object with two lists instead of a single array, 
            // but setReportData expects an array. Let's start with Pending Payments as the primary data for the table, 
            // or we handle the UI to show two tables. 
            // Simpler: Let reportData be the "Pending Payments" list for now, 
            // and we compute "Pending Reports" in the render or vice versa.
            // Actually, let's make reportData generic list and filter in UI? No, processReportData should set it.
            // Strategy: reportData will hold "Pending Payments". 
            // We will calculate "Pending Reports" separately or just repurpose reportData based on sub-selection.
            // For this iteration, let's make "Trackers" show "Pending Payments" primarily.
            // Wait, logic says "pending reports and pending payment".
            // Let's filter orders where paymentStatus is Pending.
            data = orders.filter(o => o.paymentStatus === 'Pending');
        } else if (activeTab === 'advance') {
            data = orders.filter(o => o.advancePaid && o.advancePaid > 0);
        }
        setReportData(data);
    };

    const handleDailyRegisterExport = () => {
        const allPatients = storage.getPatients();
        const selectedDateStr = registerDate;

        // Filter patients registered on the selected date
        // Note: createdAt is ISO string, so we split by 'T'
        const dailyPatients = allPatients.filter(p => p.createdAt && p.createdAt.startsWith(selectedDateStr));

        if (dailyPatients.length === 0) {
            alert(`No patients found registered on ${selectedDateStr}`);
            return;
        }

        // Prepare comprehensive data
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

        // Adjust column widths
        const wscols = Object.keys(exportData[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Daily Register");

        XLSX.writeFile(wb, `Patient_Register_${selectedDateStr}.xlsx`);
    };

    const handleOutsourcingExport = () => {
        const allOrders = storage.getOrders();
        const selectedDateStr = registerDate;

        const outsourcedTests = [];

        allOrders.forEach(o => {
            if (!o.tests) return;
            o.tests.forEach(test => {
                const isOutsourced = test.labPartner && test.labPartner !== 'In-House';
                const dateToCompare = o.accessionDate || o.createdAt;

                if (isOutsourced && dateToCompare && dateToCompare.startsWith(selectedDateStr)) {
                    outsourcedTests.push({
                        orderId: o.id,
                        patientId: o.patientId,
                        testName: test.name,
                        testCode: test.code,
                        labPartner: test.labPartner,
                        sentDate: new Date(dateToCompare).toLocaleString(),
                        status: o.status
                    });
                }
            });
        });

        if (outsourcedTests.length === 0) {
            alert(`No outsourced tests found for ${selectedDateStr}`);
            return;
        }

        const exportData = outsourcedTests.map(t => ({
            'Order ID': t.orderId,
            'Patient': t.patientId,
            'Test Name': t.testName,
            'Lab Partner': t.labPartner,
            'Sent Date': t.sentDate,
            'Status': t.status
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wscols = Object.keys(exportData[0]).map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Outsourcing");
        XLSX.writeFile(wb, `Outsourcing_Report_${selectedDateStr}.xlsx`);
    };

    const handleExport = () => {
        let headers = [];
        let dataRows = [];
        let filename = `report_${activeTab}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Define Report Columns
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
        } else {
            // Transaction export
            headers = ['Order ID', 'Patient', 'Date', 'Payment Mode', 'Status', 'Amount'];
            dataRows = orders.map(o => [o.id, o.patientId, o.createdAt, o.paymentMode || 'Cash', o.status, o.totalAmount]);
            filename = `transactions_${new Date().toISOString().split('T')[0]}.xlsx`;
        }

        // Create Letterhead / Branding Rows
        const brandingRows = [
            ['LIMSPro Labs'],
            ['123 Health Avenue, Medical District'],
            ['Phone: +1 (555) 123-4567 | GSTIN: 22AAAAA0000A1Z5'],
            ['Report Generated: ' + new Date().toLocaleString()],
            [] // Empty row for spacing
        ];

        // Combine All Rows
        const finalData = [
            ...brandingRows,
            headers,
            ...dataRows
        ];

        // Create Worksheet
        const ws = XLSX.utils.aoa_to_sheet(finalData);

        // Optional: Simple column width adjustments (heuristic)
        const wscols = headers.map(() => ({ wch: 20 }));
        ws['!cols'] = wscols;

        // Create Workbook and Export
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
        XLSX.writeFile(wb, filename);
    };

    const StatusChip = ({ status }) => {
        const styles = {
            completed: 'bg-emerald-100 text-emerald-700',
            pending: 'bg-amber-100 text-amber-700',
            processing: 'bg-blue-100 text-blue-700',
            cancelled: 'bg-rose-100 text-rose-700'
        };
        return (
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
                {status}
            </span>
        );
    };

    const filteredTransactions = orders.filter(o =>
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
                    <p className="text-slate-500">Track revenue, payments, and detailed analytics.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-1.5">
                        <span className="text-xs font-semibold text-slate-500 mr-2 uppercase">Register Date:</span>
                        <input
                            type="date"
                            value={registerDate}
                            onChange={(e) => setRegisterDate(e.target.value)}
                            className="outline-none text-sm text-slate-700 font-medium bg-transparent"
                        />
                    </div>
                    <button
                        onClick={handleDailyRegisterExport}
                        className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all font-medium text-sm"
                    >
                        <FileText className="mr-2 h-4 w-4" /> Export Daily Register
                    </button>
                    <button
                        onClick={handleOutsourcingExport}
                        className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-700 transition-all font-medium text-sm"
                    >
                        <Building2 className="mr-2 h-4 w-4" /> Export Outsourcing
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all font-medium text-sm"
                    >
                        <Download className="mr-2 h-4 w-4" /> Export Financials
                    </button>
                </div>
            </header>

            {/* Quick Stats - Only on Overview */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
                                <DollarSign className="h-6 w-6" />
                            </div>
                            <span className="flex items-center text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                                <TrendingUp className="h-3 w-3 mr-1" /> +12%
                            </span>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-800">₹{stats.totalRevenue.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <Calendar className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Today's Revenue</p>
                        <h3 className="text-3xl font-bold text-slate-800">₹{stats.todayRevenue.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                                <CreditCard className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Pending Processing (Est.)</p>
                        <h3 className="text-3xl font-bold text-slate-800">₹{stats.pendingAmount.toLocaleString()}</h3>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                        </div>
                        <p className="text-slate-500 text-sm font-medium">Avg. Order Value</p>
                        <h3 className="text-3xl font-bold text-slate-800">₹{stats.avgOrderValue.toLocaleString()}</h3>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="mb-6 flex space-x-2 overflow-x-auto pb-2">
                {['Overview', 'Daily', 'Tests', 'Patients', 'Advance'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab.toLowerCase())}
                        className={`px-6 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.toLowerCase()
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                            }`}
                    >
                        {tab} Details
                    </button>
                ))}
            </div>

            {/* Content Area */}
            {activeTab === 'overview' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Transaction List */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-bold text-slate-800 text-lg">Recent Transactions</h2>
                            <button className="text-sm text-indigo-600 font-medium hover:text-indigo-700">View All</button>
                        </div>

                        <div className="p-4 border-b border-slate-100">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search transactions..."
                                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                    <tr>
                                        <th className="px-6 py-4">Transaction ID</th>
                                        <th className="px-6 py-4">Patient</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Payment</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Amount</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTransactions.length === 0 ? (
                                        <tr><td colSpan="6" className="text-center py-12 text-slate-400">No transactions found.</td></tr>
                                    ) : (
                                        filteredTransactions.slice(0, 10).map(order => (
                                            <tr key={order.id} className="hover:bg-slate-50/50">
                                                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-600">{order.id}</td>
                                                <td className="px-6 py-4 text-sm font-medium text-slate-800">{order.patientId}</td>
                                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 font-medium">{order.paymentMode || 'Cash'}</td>
                                                <td className="px-6 py-4">
                                                    <StatusChip status={order.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-800">₹{order.totalAmount}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600">
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Revenue Charts Section */}
                    <div className="space-y-6">
                        {/* Revenue Trend Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4">Revenue Trend (7 Days)</h3>
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyRevenueData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                                        <YAxis hide />
                                        <Tooltip
                                            cursor={{ fill: '#F1F5F9' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Payment Mix Pie Chart */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h3 className="font-bold text-slate-800 mb-4">Payment Mix</h3>
                            <div className="h-48 flex items-center justify-center">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={paymentMixData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={70}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {paymentMixData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'][index % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-lg text-white">
                            <h3 className="font-bold text-lg mb-2">Pro Optimization Tip</h3>
                            <p className="text-indigo-100 text-sm mb-4">
                                Your "Pending Processing" revenue is higher than average. Consider prioritizing sample collection to recognize revenue faster.
                            </p>
                            <button className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors">
                                View Optimization Report
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                <tr>
                                    {activeTab === 'daily' && (
                                        <>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Order Count</th>
                                            <th className="px-6 py-4">Cash Sales</th>
                                            <th className="px-6 py-4">Other Sales</th>
                                            <th className="px-6 py-4 text-right">Total Revenue</th>
                                        </>
                                    )}
                                    {activeTab === 'tests' && (
                                        <>
                                            <th className="px-6 py-4">Test Code</th>
                                            <th className="px-6 py-4">Test Name</th>
                                            <th className="px-6 py-4">Quantity Sold</th>
                                            <th className="px-6 py-4 text-right">Total Revenue</th>
                                        </>
                                    )}
                                    {activeTab === 'patients' && (
                                        <>
                                            <th className="px-6 py-4">Patient ID</th>
                                            <th className="px-6 py-4">Patient Name</th>
                                            <th className="px-6 py-4">Last Visit</th>
                                            <th className="px-6 py-4">Visit Count</th>
                                            <th className="px-6 py-4 text-right">Total Spent</th>
                                        </>
                                    )}
                                    {activeTab === 'trackers' && (
                                        <>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Patient</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Payment Status</th>
                                            <th className="px-6 py-4 text-right">Due Amount</th>
                                        </>
                                    )}
                                    {activeTab === 'advance' && (
                                        <>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Patient</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4 text-right">Total Amount</th>
                                            <th className="px-6 py-4 text-right">Advance Paid</th>
                                            <th className="px-6 py-4 text-right">Balance Due</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {reportData.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center py-12 text-slate-400">No data available for this report.</td></tr>
                                ) : (
                                    reportData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50">
                                            {activeTab === 'daily' && (
                                                <>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{row.date}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{row.count}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">₹{row.cash}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">₹{row.other}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td>
                                                </>
                                            )}
                                            {activeTab === 'tests' && (
                                                <>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-600 bg-slate-50 w-24">{row.code}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{row.name}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{row.count}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td>
                                                </>
                                            )}
                                            {activeTab === 'patients' && (
                                                <>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.id}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{row.name}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{row.lastVisit}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{row.visits}</td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.revenue}</td>
                                                </>
                                            )}
                                            {activeTab === 'trackers' && (
                                                <>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.id}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{row.patientId}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs font-bold uppercase">Pending</span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-slate-800 text-right">₹{row.totalAmount}</td>
                                                </>
                                            )}
                                            {activeTab === 'advance' && (
                                                <>
                                                    <td className="px-6 py-4 text-xs font-bold text-slate-600">{row.id}</td>
                                                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{row.patientId}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(row.createdAt).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 text-right text-sm text-slate-600">₹{row.totalAmount}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-emerald-600">₹{row.advancePaid}</td>
                                                    <td className="px-6 py-4 text-right text-sm font-bold text-rose-600">₹{row.balanceDue}</td>
                                                </>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Additional Sub-Section for Pending Reports (Logic in UI for simplicity) */}
                    {activeTab === 'trackers' && (
                        <div className="p-6 border-t border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-indigo-600" /> Pending Lab Reports
                            </h3>
                            <div className="overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-3">Order ID</th>
                                            <th className="px-6 py-3">Patient</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {orders.filter(o => o.status !== 'completed').length === 0 ? (
                                            <tr><td colSpan="3" className="text-center py-6 text-slate-400">All reports completed!</td></tr>
                                        ) : (
                                            orders.filter(o => o.status !== 'completed').map(o => (
                                                <tr key={o.id}>
                                                    <td className="px-6 py-3 text-xs font-bold text-slate-600">{o.id}</td>
                                                    <td className="px-6 py-3 text-sm text-slate-800">{o.patientId}</td>
                                                    <td className="px-6 py-3"><StatusChip status={o.status} /></td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Finance;

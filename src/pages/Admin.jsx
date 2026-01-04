import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Download, Trash2, Users, Activity, AlertTriangle, FileText, Database } from 'lucide-react';
import { storage } from '../data/storage';
import { TEST_CATALOG } from '../data/testCatalog';

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [stats, setStats] = useState({ patients: 0, orders: 0, storage: 0, revenue: 0, mrp: 0, cost: 0, profit: 0, userCount: 0 });
    const [logs, setLogs] = useState([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [users, setUsers] = useState([]);

    // New user form state
    // Employee form state
    const [newUser, setNewUser] = useState({
        name: '', username: '', password: '',
        role: 'Staff', department: 'Phlebotomy',
        phone: '', email: '', salary: '', status: 'Active',
        joiningDate: new Date().toISOString().slice(0, 10)
    });
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditingUser, setIsEditingUser] = useState(false); // Track if we are editing

    // Referral state
    const [referrals, setReferrals] = useState([]);
    const [newReferral, setNewReferral] = useState({ name: '', type: 'Doctor', phone: '' });
    const [isAddReferralOpen, setIsAddReferralOpen] = useState(false);

    useEffect(() => {
        if (isAuthenticated) {
            loadAdminData();
        }
    }, [isAuthenticated]);

    const loadAdminData = () => {
        const patients = storage.getPatients();
        const orders = storage.getOrders();
        const startUsers = storage.getUsers();
        setUsers(startUsers);
        setReferrals(storage.getReferrals());

        // Calculate storage usage (approx)
        const storageSize = JSON.stringify(patients).length + JSON.stringify(orders).length;

        // Calculate Financials
        let totalRevenue = 0;
        let totalMRP = 0;
        let totalCost = 0;

        orders.forEach(order => {
            // Revenue is what was actually charged (after discount)
            totalRevenue += (order.totalAmount || 0);

            // Calculate Costs based on Tests
            if (order.tests) {
                order.tests.forEach(test => {
                    totalMRP += (test.price || 0);

                    // Lookup latest L2L price from catalog (handle historical data)
                    const catalogTest = TEST_CATALOG.find(t => t.id === test.id || t.code === test.code);
                    const l2lPrice = catalogTest?.l2lPrice || test.l2lPrice;

                    // Use L2L price if available, otherwise default to 40% of MRP (Industry Standard)
                    const cost = l2lPrice || (test.price * 0.4);
                    totalCost += cost;
                });
            }
        });

        const netProfit = totalRevenue - totalCost;

        setStats({
            patients: patients.length,
            orders: orders.length,
            storage: Math.round(storageSize / 1024), // KB
            revenue: totalRevenue,
            mrp: totalMRP,
            cost: totalCost,
            profit: netProfit,
            userCount: startUsers.length
        });

        // Generate Audit Logs
        // Combine activities and sort by date desc
        const patientLogs = patients.map(p => ({
            type: 'PATIENT_REGISTRATION',
            desc: `New patient registered: ${p.fullName} (${p.id})`,
            time: p.createdAt,
            user: 'Staff' // Mock user
        }));

        const orderLogs = orders.map(o => ({
            type: 'ORDER_CREATION',
            desc: `Order created: ${o.id} - ${o.tests.length} tests`,
            time: o.createdAt,
            user: 'Phlebotomist'
        }));

        // Add Financial Log
        const financialLogs = [{
            type: 'SYSTEM',
            desc: `Profitability calculation updated. Margin: ${totalRevenue ? Math.round((netProfit / totalRevenue) * 100) : 0}%`,
            time: new Date().toISOString(),
            user: 'System'
        }];

        const allLogs = [...patientLogs, ...orderLogs, ...financialLogs]
            .sort((a, b) => new Date(b.time) - new Date(a.time));

        setLogs(allLogs);
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === '1234') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Invalid Access PIN');
            setPin('');
        }
    };

    const handleExport = () => {
        storage.exportBackup();
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const backup = JSON.parse(e.target.result);

                if (!backup.patients || !backup.orders) {
                    alert('Invalid backup file format');
                    return;
                }

                if (confirm(`Restore backup from ${new Date(backup.exportedAt).toLocaleString()}? \n\n⚠️ CURRENT DATA WILL BE REPLACED.`)) {
                    localStorage.setItem('lis_patients', JSON.stringify(backup.patients));
                    localStorage.setItem('lis_orders', JSON.stringify(backup.orders));
                    if (backup.users) localStorage.setItem('lis_users', JSON.stringify(backup.users));
                    if (backup.counters) localStorage.setItem('lis_counters', JSON.stringify(backup.counters));

                    alert('System Restored Successfully! Reloading...');
                    window.location.reload();
                }
            } catch (err) {
                console.error(err);
                alert('Failed to parse backup file');
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
    };



    const handleAddUser = (e) => {
        e.preventDefault();
        if (!newUser.username || !newUser.password) return;

        if (isEditingUser && newUser.id) {
            storage.updateUser(newUser.id, newUser);
        } else {
            storage.saveUser(newUser);
        }

        setNewUser({
            name: '', username: '', password: '',
            role: 'Staff', department: 'Phlebotomy',
            phone: '', email: '', salary: '', status: 'Active',
            joiningDate: new Date().toISOString().slice(0, 10)
        });
        setIsAddUserOpen(false);
        setIsEditingUser(false);
        loadAdminData(); // Refresh list
    };

    const handleEditUser = (user) => {
        setNewUser({
            ...user,
            password: user.password || '', // Ensure password field handles existing data
            joiningDate: user.joiningDate ? user.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
        });
        setIsEditingUser(true);
        setIsAddUserOpen(true);
    };

    const handleDeleteUser = (id) => {
        if (confirm('Remove this user access?')) {
            storage.deleteUser(id);
            loadAdminData();
        }
    };

    const handleAddReferral = (e) => {
        e.preventDefault();
        if (!newReferral.name) return;
        storage.saveReferral(newReferral);
        setNewReferral({ name: '', type: 'Doctor', phone: '' });
        setIsAddReferralOpen(false);
        loadAdminData();
    };

    const handleDeleteReferral = (id) => {
        if (confirm('Delete this referral?')) {
            storage.deleteReferral(id);
            loadAdminData();
        }
    };

    const handleFactoryReset = () => {
        // Already confirmed via UI state
        storage.factoryReset();
        // Small delay to ensure storage is cleared before reload
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md text-center">
                    <div className="h-20 w-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="h-10 w-10 text-indigo-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Access</h2>
                    <p className="text-slate-500 mb-8">Enter security PIN to access system controls.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <input
                            type="password"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="Enter PIN (1234)"
                            className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                            maxLength={4}
                        />
                        {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
                        <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">
                            Unlock System
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Shield className="mr-3 h-8 w-8 text-indigo-600" />
                        Admin & Security Control
                    </h1>
                    <p className="text-slate-500">System management, access logs, and data security. <span className="text-xs bg-slate-100 px-2 py-0.5 rounded ml-2">v1.1</span></p>
                </div>
                <button
                    onClick={() => setIsAuthenticated(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium flex items-center text-sm"
                >
                    <Lock className="h-4 w-4 mr-2" /> Lock Console
                </button>
            </header>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-4 bg-blue-50 text-blue-600 rounded-xl mr-4">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Patients</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.patients}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl mr-4">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Orders</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.orders}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl mr-4">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Users</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.userCount}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center">
                    <div className="p-4 bg-amber-50 text-amber-600 rounded-xl mr-4">
                        <Database className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Data Size</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.storage} KB</h3>
                    </div>
                </div>
            </div>

            {/* Profitability Analysis */}
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Activity className="h-6 w-6 mr-2 text-indigo-600" />
                Profitability Report (MRP vs L2L)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total MRP Value</p>
                    <h3 className="text-2xl font-bold text-slate-800">₹{stats.mrp.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-1">Gross potential revenue</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Total Revenue (Actual)</p>
                    <h3 className="text-2xl font-bold text-emerald-600">₹{stats.revenue.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-1">After discounts</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">L2L / Outsource Cost</p>
                    <h3 className="text-2xl font-bold text-rose-500">₹{stats.cost.toLocaleString()}</h3>
                    <p className="text-xs text-slate-400 mt-1">Estimated Cost</p>
                </div>
                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-2xl shadow-sm text-white">
                    <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-2">Net Profit</p>
                    <h3 className="text-3xl font-bold white">₹{stats.profit.toLocaleString()}</h3>
                    <p className="text-xs text-indigo-200 mt-1">
                        Margin: {stats.revenue ? Math.round((stats.profit / stats.revenue) * 100) : 0}%
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Column: Logs */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h2 className="font-bold text-slate-800 flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-slate-500" />
                                System Activity Logs
                            </h2>
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">Live</span>
                        </div>
                        <div className="p-0">
                            {logs.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">No activity recorded yet.</div>
                            ) : (
                                <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                                    {logs.map((log, idx) => (
                                        <div key={idx} className="p-4 hover:bg-slate-50 flex items-start">
                                            <div className={`mt-1 h-2 w-2 rounded-full mr-4 flex-shrink-0 ${log.type === 'REFUND' ? 'bg-rose-500' :
                                                log.type === 'LOGIN' ? 'bg-indigo-500' : 'bg-emerald-500'
                                                }`} />
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start">
                                                    <p className="text-sm font-medium text-slate-800">{log.desc}</p>
                                                    <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                                                        {new Date(log.time).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">User: {log.user} • IP: 192.168.1.10{idx % 3}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                                Employee Management
                            </h3>
                            <button
                                onClick={() => {
                                    setIsAddUserOpen(!isAddUserOpen);
                                    setIsEditingUser(false);
                                    setNewUser({
                                        name: '', username: '', password: '',
                                        role: 'Staff', department: 'Phlebotomy',
                                        phone: '', email: '', salary: '', status: 'Active',
                                        joiningDate: new Date().toISOString().slice(0, 10)
                                    });
                                }}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium hover:bg-indigo-100"
                            >
                                {isAddUserOpen ? 'Cancel' : '+ Add Employee'}
                            </button>
                        </div>

                        {isAddUserOpen && (
                            <form onSubmit={handleAddUser} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                        <input required type="text" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="e.g. John Doe" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Joining Date</label>
                                        <input type="date" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.joiningDate} onChange={e => setNewUser({ ...newUser, joiningDate: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                                        <input required type="text" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} placeholder="jdoe" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                                        <input required type="text" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} placeholder="secret" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                        <input type="email" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="Optional" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                        <input type="tel" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="Optional" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Dept</label>
                                        <select className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })}>
                                            <option>Phlebotomy</option>
                                            <option>Lab</option>
                                            <option>Finance</option>
                                            <option>Management</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                                        <select className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                            <option>Staff</option>
                                            <option>Manager</option>
                                            <option>Admin</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                        <select className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.status} onChange={e => setNewUser({ ...newUser, status: e.target.value })}>
                                            <option value="Active">Active</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Monthly Salary (₹)</label>
                                    <input type="number" className="w-full text-sm p-2 rounded border border-slate-200" value={newUser.salary} onChange={e => setNewUser({ ...newUser, salary: e.target.value })} placeholder="0.00" />
                                </div>

                                <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700">
                                    {isEditingUser ? 'Update Employee' : 'Create Employee'}
                                </button>
                            </form>
                        )}

                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
                            {users.map(u => (
                                <div key={u.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                    <div className="flex items-center">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${u.status === 'Inactive' ? 'bg-slate-200 text-slate-500' :
                                            u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                                u.department === 'Finance' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {u.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800 flex items-center">
                                                {u.name}
                                                {u.status === 'Inactive' && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded">Inactive</span>}
                                            </p>
                                            <p className="text-xs text-slate-500">{u.role} • {u.department} {u.phone && `• ${u.phone}`}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleEditUser(u)} className="text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all text-xs font-medium">
                                            Edit
                                        </button>
                                        {u.username !== 'admin' && ( // Prevent deleting main admin
                                            <button onClick={() => handleDeleteUser(u.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-slate-800 flex items-center">
                                <Users className="h-5 w-5 mr-2 text-indigo-600" />
                                Referral Management
                            </h3>
                            <button
                                onClick={() => setIsAddReferralOpen(!isAddReferralOpen)}
                                className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded font-medium hover:bg-indigo-100"
                            >
                                {isAddReferralOpen ? 'Cancel' : '+ Add Referral'}
                            </button>
                        </div>

                        {isAddReferralOpen && (
                            <form onSubmit={handleAddReferral} className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                                    <input required type="text" className="w-full text-sm p-2 rounded border border-slate-200" value={newReferral.name} onChange={e => setNewReferral({ ...newReferral, name: e.target.value })} placeholder="Dr. Smith / City Hospital" />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                        <select className="w-full text-sm p-2 rounded border border-slate-200" value={newReferral.type} onChange={e => setNewReferral({ ...newReferral, type: e.target.value })}>
                                            <option>Doctor</option>
                                            <option>Organization</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                        <input type="text" className="w-full text-sm p-2 rounded border border-slate-200" value={newReferral.phone} onChange={e => setNewReferral({ ...newReferral, phone: e.target.value })} placeholder="Optional" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700">Add Referral</button>
                            </form>
                        )}

                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {referrals.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">No referrals added yet.</p> : referrals.map(r => (
                                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                                    <div className="flex items-center">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${r.type === 'Doctor' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {r.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">{r.name}</p>
                                            <p className="text-xs text-slate-500">{r.type} {r.phone && `• ${r.phone}`}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteReferral(r.id)} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <Database className="h-5 w-5 mr-2 text-amber-600" />
                            Data Management
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={handleExport}
                                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-medium flex items-center justify-center transition-colors border border-slate-200"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export Database (JSON)
                            </button>

                            <div className="relative">
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleImport}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <button
                                    className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-medium flex items-center justify-center transition-colors border border-indigo-200"
                                >
                                    <Unlock className="h-4 w-4 mr-2" />
                                    Restore Backup
                                </button>
                            </div>

                            <div className="pt-4 border-t border-slate-100 mt-4">
                                <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Danger Zone</h4>
                                {!showDeleteConfirm ? (
                                    <button
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-medium flex items-center justify-center transition-colors border border-rose-100"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Factory Reset System
                                    </button>
                                ) : (
                                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                                        <p className="text-xs text-center text-rose-600 font-bold">Are you absolutely sure?</p>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setShowDeleteConfirm(false)}
                                                className="flex-1 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleFactoryReset}
                                                className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700"
                                            >
                                                Yes, Delete All
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Admin;

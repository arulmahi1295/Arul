import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Download, Trash2, Users, Activity, FileText, Database, Upload, PenTool, LayoutDashboard, UserPlus, FileSignature, Settings, AlertTriangle, Tag } from 'lucide-react';
import { storage } from '../data/storage';
import { TEST_CATALOG } from '../data/testCatalog';
import TestPricingManager from '../components/TestPricingManager';
import ReferralPriceManager from '../components/ReferralPriceManager'; // New Import

// --- Sub-Components ---

const DashboardView = ({ stats, logs }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Activity className="h-6 w-6 mr-2 text-indigo-600" />
                Profitability Report (MRP vs L2L)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
        </div>

        {/* Logs */}
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
);

const EmployeeManagement = ({ users, onSave, onDelete, onEdit }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '', username: '', password: '',
        role: 'Staff', department: 'Phlebotomy',
        phone: '', email: '', salary: '', status: 'Active',
        joiningDate: new Date().toISOString().slice(0, 10)
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData, isEditing);
        setIsFormOpen(false);
        setFormData({
            name: '', username: '', password: '',
            role: 'Staff', department: 'Phlebotomy',
            phone: '', email: '', salary: '', status: 'Active',
            joiningDate: new Date().toISOString().slice(0, 10)
        });
    };

    const handleEditClick = (user) => {
        setFormData({
            ...user,
            password: user.password || '',
            joiningDate: user.joiningDate ? user.joiningDate.slice(0, 10) : new Date().toISOString().slice(0, 10)
        });
        setIsEditing(true);
        setIsFormOpen(true);
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Employee Management</h2>
                    <p className="text-slate-500">Manage system access and staff details</p>
                </div>
                <button
                    onClick={() => {
                        setIsFormOpen(!isFormOpen);
                        setIsEditing(false);
                        setFormData({
                            name: '', username: '', password: '',
                            role: 'Staff', department: 'Phlebotomy',
                            phone: '', email: '', salary: '', status: 'Active',
                            joiningDate: new Date().toISOString().slice(0, 10)
                        });
                    }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isFormOpen ? 'Cancel' : 'Add Employee'}
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 mb-8">
                    <h3 className="font-bold text-indigo-900 mb-4">{isEditing ? 'Edit Employee' : 'New Employee Details'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Full Name</label>
                                <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. John Doe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Joining Date</label>
                                <input type="date" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.joiningDate} onChange={e => setFormData({ ...formData, joiningDate: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                                <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="jdoe" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Password</label>
                                <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="secret" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                                <input type="email" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Optional" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                <input type="tel" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Optional" />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Dept</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                    <option>Phlebotomy</option>
                                    <option>Lab</option>
                                    <option>Finance</option>
                                    <option>Management</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Role</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                                    <option>Staff</option>
                                    <option>Manager</option>
                                    <option>Admin</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2">
                            <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
                                {isEditing ? 'Update Employee' : 'Create Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="font-bold text-slate-700">Staff Directory ({users.length})</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {users.map(u => (
                        <div key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold mr-4 ${u.status === 'Inactive' ? 'bg-slate-200 text-slate-500' :
                                    u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                        u.department === 'Finance' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    {u.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800 flex items-center">
                                        {u.name}
                                        {u.status === 'Inactive' && <span className="ml-2 text-[10px] bg-slate-200 text-slate-600 px-1.5 rounded-full">Inactive</span>}
                                    </p>
                                    <p className="text-xs text-slate-500">{u.role} • {u.department}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button onClick={() => handleEditClick(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    <PenTool className="h-4 w-4" />
                                </button>
                                {u.username !== 'admin' && (
                                    <button onClick={() => onDelete(u.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ReferralManagement = ({ referrals, onAdd, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'Doctor', phone: '' });
    const [selectedReferral, setSelectedReferral] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        setIsFormOpen(false);
        setFormData({ name: '', type: 'Doctor', phone: '' });
    };

    if (selectedReferral) {
        return <ReferralPriceManager referral={selectedReferral} onClose={() => setSelectedReferral(null)} />;
    }

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Referral Management</h2>
                    <p className="text-slate-500">Manage referring doctors and hospitals</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isFormOpen ? 'Cancel' : 'Add Referral'}
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 mb-8">
                    <h3 className="font-bold text-indigo-900 mb-4">New Referral</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Name</label>
                            <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Dr. Smith / City Hospital" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                                <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option>Doctor</option>
                                    <option>Organization</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Phone</label>
                                <input type="text" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="Optional" />
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Add Referral</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Referral List</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {referrals.length === 0 ? <p className="text-slate-400 text-center py-8">No referrals added yet.</p> : referrals.map(r => (
                        <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold mr-4 ${r.type === 'Doctor' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                    {r.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{r.name}</p>
                                    <p className="text-xs text-slate-500">{r.type} {r.phone && `• ${r.phone}`}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setSelectedReferral(r)}
                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-100"
                                >
                                    Prices
                                </button>
                                <button onClick={() => onDelete(r.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const OutsourceLabManagement = ({ labs, onAdd, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'Reference' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
        setIsFormOpen(false);
        setFormData({ name: '', type: 'Reference' });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Outsource Labs</h2>
                    <p className="text-slate-500">Manage external reference laboratories</p>
                </div>
                <button
                    onClick={() => setIsFormOpen(!isFormOpen)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isFormOpen ? 'Cancel' : 'Add Lab'}
                </button>
            </div>

            {isFormOpen && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 mb-8">
                    <h3 className="font-bold text-indigo-900 mb-4">New Laboratory</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Lab Name</label>
                            <input required type="text" className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. HealthCity" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Type</label>
                            <select className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                <option>Reference</option>
                                <option>Hospital</option>
                                <option>Specialized</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">Add Laboratory</button>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700">Lab Partners List</h3>
                </div>
                <div className="divide-y divide-slate-100">
                    {labs.length === 0 ? <p className="text-slate-400 text-center py-8">No labs added.</p> : labs.map(r => (
                        <div key={r.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-lg flex items-center justify-center text-sm font-bold mr-4 bg-purple-100 text-purple-700">
                                    {r.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">{r.name}</p>
                                    <p className="text-xs text-slate-500">{r.type}</p>
                                </div>
                            </div>
                            <button onClick={() => onDelete(r.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const ImageSetting = ({ title, image, onUpload, onDelete, icon: Icon, colorClass }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
            <Icon className={`h-5 w-5 mr-3 ${colorClass}`} />
            {title}
        </h3>
        <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center min-h-[140px] flex flex-col items-center justify-center relative">
                {image ? (
                    <div className="relative inline-block w-full">
                        <img src={image} alt={title} className="max-h-24 max-w-full object-contain mx-auto bg-white rounded-lg p-2 shadow-sm" />
                        <button onClick={onDelete} className="absolute -top-2 -right-2 bg-rose-500 text-white p-1.5 rounded-full shadow-md hover:bg-rose-600 transition-colors" title="Delete">
                            <Trash2 className="h-3 w-3" />
                        </button>
                    </div>
                ) : (
                    <div className="text-slate-400 flex flex-col items-center">
                        <div className={`p-3 rounded-full bg-white mb-2 ${colorClass.replace('text-', 'bg-').replace('600', '50')}`}>
                            <Icon className={`h-6 w-6 ${colorClass} opacity-50`} />
                        </div>
                        <p className="text-xs font-semibold">Not Set</p>
                    </div>
                )}
            </div>
            <label className="block w-full cursor-pointer bg-white border border-dashed border-slate-300 rounded-lg p-3 text-center hover:bg-slate-50 hover:border-slate-400 transition-all">
                <div className="flex items-center justify-center text-sm font-bold text-slate-600">
                    <Upload className="h-4 w-4 mr-2" /> Upload
                </div>
                <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
            </label>
        </div>
    </div>
);

const LabConfiguration = ({
    pathologistSignature, labTechSignature, headerImage, footerImage, watermarkImage,
    onUploadPathologist, onDeletePathologist,
    onUploadLabTech, onDeleteLabTech,
    onUploadHeader, onDeleteHeader,
    onUploadFooter, onDeleteFooter,
    onUploadWatermark, onDeleteWatermark
}) => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-5xl">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Lab Configuration</h2>
            <p className="text-slate-500">Manage report layout, headers, footers, and signatures.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ImageSetting
                title="Report Header"
                image={headerImage}
                onUpload={onUploadHeader}
                onDelete={onDeleteHeader}
                icon={LayoutDashboard}
                colorClass="text-blue-600"
            />
            <ImageSetting
                title="Report Footer"
                image={footerImage}
                onUpload={onUploadFooter}
                onDelete={onDeleteFooter}
                icon={LayoutDashboard}
                colorClass="text-blue-600"
            />
            <ImageSetting
                title="Watermark Logo"
                image={watermarkImage}
                onUpload={onUploadWatermark}
                onDelete={onDeleteWatermark}
                icon={Shield}
                colorClass="text-purple-600"
            />
            <ImageSetting
                title="Pathologist Sign"
                image={pathologistSignature}
                onUpload={onUploadPathologist}
                onDelete={onDeletePathologist}
                icon={PenTool}
                colorClass="text-indigo-600"
            />
            <ImageSetting
                title="Lab Tech Sign"
                image={labTechSignature}
                onUpload={onUploadLabTech}
                onDelete={onDeleteLabTech}
                icon={Users}
                colorClass="text-emerald-600"
            />
        </div>
    </div>
);

const DataManagement = ({ onExport, onImport, onFactoryReset }) => {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Data Management</h2>
                <p className="text-slate-500">Backup, restore, and system reset</p>
            </div>

            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                        <Database className="h-5 w-5 mr-3 text-amber-600" />
                        Backup & Restore
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onExport}
                            className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center transition-all border border-slate-200"
                        >
                            <Download className="h-6 w-6 mb-2 text-slate-400" />
                            Export Database
                        </button>
                        <div className="relative">
                            <input
                                type="file"
                                accept=".json"
                                onChange={onImport}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold flex flex-col items-center justify-center transition-all border border-indigo-200 h-full">
                                <Upload className="h-6 w-6 mb-2 text-indigo-400" />
                                Restore Backup
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-rose-100">
                    <h3 className="font-bold text-rose-700 mb-4 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-3" />
                        Danger Zone
                    </h3>
                    {!showDeleteConfirm ? (
                        <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold flex items-center justify-center transition-colors border border-rose-200"
                        >
                            Factory Reset System
                        </button>
                    ) : (
                        <div className="bg-rose-50 p-6 rounded-xl border border-rose-200 text-center animate-in zoom-in-95 duration-200">
                            <p className="text-rose-800 font-bold mb-1">Are you absolutely sure?</p>
                            <p className="text-xs text-rose-600 mb-4">This action cannot be undone. All data will be lost.</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-2 bg-white text-slate-600 rounded-lg text-sm font-bold shadow-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onFactoryReset}
                                    className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-rose-700"
                                >
                                    Yes, Delete All
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Main Layout ---

const Admin = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState({
        stats: { patients: 0, orders: 0, storage: 0, revenue: 0, mrp: 0, cost: 0, profit: 0, userCount: 0 },
        logs: [],
        users: [],
        referrals: [],
        outsourceLabs: [],
        outsourceLabs: [],
        signature: null,
        labTechSignature: null,
        headerImage: null,
        footerImage: null,
        watermarkImage: null
    });

    useEffect(() => {
        if (isAuthenticated) {
            loadAllData();
        }
    }, [isAuthenticated]);

    const loadAllData = async () => {
        const patients = await storage.getPatients();
        const orders = await storage.getOrders();
        const users = await storage.getUsers();
        const referrals = await storage.getReferrals();
        const outsourceLabs = await storage.getOutsourceLabs();
        const settings = await storage.getSettings();

        // Stats Logic
        const storageSize = JSON.stringify(patients).length + JSON.stringify(orders).length;
        let totalRevenue = 0, totalMRP = 0, totalCost = 0;

        orders.forEach(order => {
            totalRevenue += (Number(order.totalAmount) || 0);
            if (order.tests) {
                order.tests.forEach(test => {
                    totalMRP += (Number(test.price) || 0);
                    const catalogTest = TEST_CATALOG.find(t => t.id == test.id || t.code === test.code);
                    const l2lPrice = catalogTest?.l2lPrice;
                    const cost = l2lPrice || ((Number(test.price) || 0) * 0.40); // 40% fallback
                    totalCost += cost;
                });
            }
        });

        // Logs Logic
        const patientLogs = patients.map(p => ({
            type: 'PATIENT_REGISTRATION',
            desc: `New patient registered: ${p.fullName} (${p.id})`,
            time: p.createdAt,
            user: 'Staff'
        }));
        const orderLogs = orders.map(o => ({
            type: 'ORDER_CREATION',
            desc: `Order created: ${o.id} - ${o.tests ? o.tests.length : 0} tests`,
            time: o.createdAt,
            user: 'Phlebotomist'
        }));

        // Safety check for invalid dates before kind
        const allLogs = [...patientLogs, ...orderLogs].sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));

        setData({
            stats: {
                patients: patients.length,
                orders: orders.length,
                storage: Math.round(storageSize / 1024),
                revenue: totalRevenue,
                mrp: totalMRP,
                cost: totalCost,
                profit: totalRevenue - totalCost,
                userCount: users.length
            },
            logs: allLogs,
            users,
            referrals,
            outsourceLabs,
            signature: settings?.signature,
            labTechSignature: settings?.labTechSignature,
            headerImage: settings?.headerImage,
            footerImage: settings?.footerImage,
            watermarkImage: settings?.watermarkImage
        });
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (pin === '1234') {
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Invalid PIN');
            setPin('');
        }
    };

    // --- Action Handlers ---

    const handleUserSave = async (userData, isEditing) => {
        if (isEditing && userData.id) {
            await storage.updateUser(userData.id, userData);
        } else {
            await storage.saveUser(userData);
        }
        loadAllData();
    };

    const handleUserDelete = async (id) => {
        if (confirm('Remove this user access?')) {
            await storage.deleteUser(id);
            loadAllData();
        }
    };

    const handleReferralSave = async (refData) => {
        await storage.saveReferral(refData);
        loadAllData();
    };

    const handleReferralDelete = async (id) => {
        if (confirm('Delete this referral?')) {
            await storage.deleteReferral(id);
            loadAllData();
        }
    };

    const handleOutsourceLabSave = async (labData) => {
        await storage.saveOutsourceLab(labData);
        loadAllData();
    };

    const handleOutsourceLabDelete = async (id) => {
        if (confirm('Delete this lab?')) {
            await storage.deleteOutsourceLab(id);
            loadAllData();
        }
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Check file size (limit to 500KB)
        const MAX_SIZE = 500 * 1024; // 500KB
        if (file.size > MAX_SIZE) {
            alert(`File is too large (${(file.size / 1024).toFixed(0)}KB). Please upload a smaller image (max 500KB).`);
            e.target.value = null; // Reset input
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            try {
                await storage.saveSettings({ signature: base64 });
                loadAllData();
                alert('Pathologist Signature uploaded successfully!');
            } catch (error) {
                console.error("Upload failed", error);
                alert(`Upload failed: ${error.message}`);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteSignature = async () => {
        await storage.saveSettings({ signature: null });
        loadAllData();
    };

    const handleLabTechUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const MAX_SIZE = 500 * 1024;
        if (file.size > MAX_SIZE) {
            alert(`File is too large (${(file.size / 1024).toFixed(0)}KB). Please upload a smaller image (max 500KB).`);
            e.target.value = null;
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result;
            try {
                await storage.saveSettings({ labTechSignature: base64 });
                loadAllData();
                alert('Lab Technician Signature uploaded successfully!');
            } catch (error) {
                console.error("Upload failed", error);
                alert(`Upload failed: ${error.message}`);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteLabTech = async () => {
        await storage.saveSettings({ labTechSignature: null });
        loadAllData();
    };

    // Generic Settings Handlers
    const handleSettingUpload = (e, key) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 500 * 1024) { alert('File too large (Max 500KB)'); return; }
        const reader = new FileReader();
        reader.onloadend = async () => {
            await storage.saveSettings({ [key]: reader.result });
            loadAllData();
        };
        reader.readAsDataURL(file);
    };

    const handleSettingDelete = async (key) => {
        await storage.saveSettings({ [key]: null });
        loadAllData();
    };

    const handleHeaderUpload = (e) => handleSettingUpload(e, 'headerImage');
    const handleFooterUpload = (e) => handleSettingUpload(e, 'footerImage');
    const handleWatermarkUpload = (e) => handleSettingUpload(e, 'watermarkImage');

    // Export/Import Temporarily Disabled for Async Migration
    const handleExport = async () => {
        try {
            const patients = await storage.getPatients();
            const orders = await storage.getOrders();
            const users = await storage.getUsers();
            const referrals = await storage.getReferrals();
            const settings = await storage.getSettings();

            const backup = {
                version: "2.0", // Async version
                date: new Date().toISOString(),
                patients,
                orders,
                users,
                referrals,
                settings
            };

            const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LIMS_Backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Export failed. See console.");
        }
    };

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            try {
                const backup = JSON.parse(ev.target.result);
                if (confirm('Restore backup? This will merge/overwrite existing data.')) {
                    // Use storage methods for compatibility with both Mock and Real Firebase
                    // Note: In a real production app, "Restore" is complex. This acts more like a "Merge".

                    if (backup.patients) {
                        for (const p of backup.patients) await storage.savePatient(p);
                    }
                    if (backup.orders) {
                        for (const o of backup.orders) await storage.saveOrder(o);
                    }
                    if (backup.users) {
                        for (const u of backup.users) await storage.saveUser(u);
                    }
                    if (backup.referrals) {
                        for (const r of backup.referrals) await storage.saveReferral(r);
                    }
                    if (backup.settings) {
                        const s = Array.isArray(backup.settings) ? backup.settings[0] : backup.settings;
                        if (s) await storage.saveSettings(s);
                    }
                    if (backup.homeCollections) {
                        for (const hc of backup.homeCollections) await storage.saveHomeCollection(hc);
                    }

                    alert('Restored successfully! Reloading...');
                    window.location.reload();
                }
            } catch (err) {
                console.error("Import error:", err);
                alert('Invalid backup file or import failed');
            }
        };
        reader.readAsText(file);
    };

    const handleFactoryReset = () => {
        if (confirm("DANGER: This will wipe ALL data. Continue?")) {
            // Clear all mock db keys
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('mock_fb_')) {
                    localStorage.removeItem(key);
                }
            });
            setTimeout(() => window.location.reload(), 500);
        }
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
                        <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="Enter PIN (1234)" className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none" maxLength={4} />
                        {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
                        <button type="submit" className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all">Unlock System</button>
                    </form>
                </div>
            </div>
        );
    }

    const tabs = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'pricing', label: 'Test Pricing (L2L)', icon: Tag },
        { id: 'employees', label: 'Employee Management', icon: Users },
        { id: 'referrals', label: 'Referral Management', icon: UserPlus },
        { id: 'labs', label: 'Outsource Labs', icon: LayoutDashboard },
        { id: 'config', label: 'Lab Configuration', icon: Settings },
        { id: 'data', label: 'Data Management', icon: Database },
    ];

    return (
        <div className="h-screen w-full bg-slate-100 p-4 font-sans flex items-center justify-center">
            <div className="flex w-full max-w-[1800px] h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">

                {/* Ultra Pro Sidebar */}
                <aside className="w-72 bg-slate-50 flex flex-col border-r border-slate-200 relative overflow-hidden">
                    {/* Decorative background blur/gradient elements could go here */}

                    <div className="p-6 border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3 text-slate-800">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl text-white shadow-lg shadow-indigo-200">
                                <Shield className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="font-bold text-lg leading-none mb-1">Admin</h1>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Console v2.0</p>
                            </div>
                        </div>
                    </div>

                    <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300 group relative ${isActive
                                        ? 'bg-white text-indigo-600 shadow-md shadow-slate-200/50 ring-1 ring-slate-100'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/80'
                                        }`}
                                >
                                    <Icon className={`h-5 w-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    <span className={isActive ? 'translate-x-1 transition-transform' : 'transition-transform'}>{tab.label}</span>
                                    {isActive && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="p-5 border-t border-slate-200 bg-slate-100/30">
                        <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/50 mb-4">
                            <p className="text-[10px] font-semibold text-indigo-400 uppercase mb-1">Security Level</p>
                            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                System Secure
                            </div>
                        </div>
                        <button
                            onClick={() => setIsAuthenticated(false)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all font-bold text-sm shadow-sm active:scale-95"
                        >
                            <Lock className="h-4 w-4" />
                            Lock Console
                        </button>
                    </div>
                </aside>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50/30 relative">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />

                    <div className="max-w-6xl mx-auto p-8 lg:p-10 relative z-0">
                        <header className="mb-8">
                            <h2 className="text-3xl font-bold text-slate-800 tracking-tight">{tabs.find(t => t.id === activeTab)?.label}</h2>
                            <p className="text-slate-500 mt-1">Manage and configure system settings.</p>
                        </header>

                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {activeTab === 'dashboard' && <DashboardView stats={data.stats} logs={data.logs} />}
                            {activeTab === 'pricing' && <TestPricingManager />}
                            {activeTab === 'employees' && <EmployeeManagement users={data.users} onSave={handleUserSave} onDelete={handleUserDelete} onEdit={null} />}
                            {activeTab === 'referrals' && <ReferralManagement referrals={data.referrals} onAdd={handleReferralSave} onDelete={handleReferralDelete} />}
                            {activeTab === 'labs' && <OutsourceLabManagement labs={data.outsourceLabs} onAdd={handleOutsourceLabSave} onDelete={handleOutsourceLabDelete} />}
                            {activeTab === 'config' && <LabConfiguration
                                pathologistSignature={data.signature}
                                labTechSignature={data.labTechSignature}
                                headerImage={data.headerImage}
                                footerImage={data.footerImage}
                                watermarkImage={data.watermarkImage}
                                onUploadPathologist={handleSignatureUpload}
                                onDeletePathologist={handleDeleteSignature}
                                onUploadLabTech={handleLabTechUpload}
                                onDeleteLabTech={handleDeleteLabTech}
                                onUploadHeader={handleHeaderUpload}
                                onDeleteHeader={() => handleSettingDelete('headerImage')}
                                onUploadFooter={handleFooterUpload}
                                onDeleteFooter={() => handleSettingDelete('footerImage')}
                                onUploadWatermark={handleWatermarkUpload}
                                onDeleteWatermark={() => handleSettingDelete('watermarkImage')}
                            />}
                            {activeTab === 'data' && <DataManagement onExport={handleExport} onImport={handleImport} onFactoryReset={handleFactoryReset} />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Admin;

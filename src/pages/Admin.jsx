import React, { useState, useEffect } from 'react';
import { Shield, Lock, Unlock, Download, Trash2, Users, Activity, FileText, Database, Upload, PenTool, LayoutDashboard, UserPlus, FileSignature, Settings, AlertTriangle } from 'lucide-react';
import { storage } from '../data/storage';
import { TEST_CATALOG } from '../data/testCatalog';

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

const ReferralManagement = ({ referrals, onSave, onDelete }) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', type: 'Doctor', phone: '' });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
        setIsFormOpen(false);
        setFormData({ name: '', type: 'Doctor', phone: '' });
    };

    return (
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
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

const LabConfiguration = ({ signature, onUpload, onDeleteSignature }) => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl">
        <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Lab Configuration</h2>
            <p className="text-slate-500">Report settings and digital signatures</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center">
                <PenTool className="h-5 w-5 mr-3 text-indigo-600" />
                Digital Signature
            </h3>
            <div className="space-y-6">
                <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    {signature ? (
                        <div className="relative inline-block group">
                            <img src={signature} alt="Signature" className="h-24 object-contain mx-auto bg-white rounded-lg p-2 shadow-sm" />
                            <button
                                onClick={onDeleteSignature}
                                className="absolute -top-3 -right-3 bg-rose-500 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-600 transition-colors"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                            <p className="text-xs text-emerald-600 font-bold mt-4 flex items-center justify-center">
                                <Shield className="h-3 w-3 mr-1" />
                                Signature Active
                            </p>
                        </div>
                    ) : (
                        <div className="text-slate-400">
                            <FileSignature className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No signature uploaded</p>
                            <p className="text-xs mt-1">Upload a transparent PNG for automatic signing</p>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block w-full cursor-pointer bg-white border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:bg-indigo-50/50 hover:border-indigo-300 transition-all">
                        <Upload className="h-8 w-8 text-indigo-400 mx-auto mb-2" />
                        <span className="block text-sm font-bold text-indigo-600">Click to Upload Signature</span>
                        <span className="block text-xs text-slate-400 mt-1">Supports PNG, JPG (Max 2MB)</span>
                        <input type="file" accept="image/*" onChange={onUpload} className="hidden" />
                    </label>
                </div>
            </div>
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
        signature: null
    });

    useEffect(() => {
        if (isAuthenticated) {
            loadAllData();
        }
    }, [isAuthenticated]);

    const loadAllData = () => {
        const patients = storage.getPatients();
        const orders = storage.getOrders();
        const users = storage.getUsers();
        const referrals = storage.getReferrals();
        const settings = storage.getSettings();

        // Stats Logic
        const storageSize = JSON.stringify(patients).length + JSON.stringify(orders).length;
        let totalRevenue = 0, totalMRP = 0, totalCost = 0;

        orders.forEach(order => {
            totalRevenue += (order.totalAmount || 0);
            if (order.tests) {
                order.tests.forEach(test => {
                    totalMRP += (test.price || 0);
                    const catalogTest = TEST_CATALOG.find(t => t.id == test.id || t.code === test.code);
                    const l2lPrice = catalogTest?.l2lPrice || test.l2lPrice;
                    const cost = l2lPrice || ((test.price || 0) * 0.40); // 40% fallback
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
            desc: `Order created: ${o.id} - ${o.tests.length} tests`,
            time: o.createdAt,
            user: 'Phlebotomist'
        }));
        const allLogs = [...patientLogs, ...orderLogs].sort((a, b) => new Date(b.time) - new Date(a.time));

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
            signature: settings.signature
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

    const handleUserSave = (userData, isEditing) => {
        if (isEditing && userData.id) {
            storage.updateUser(userData.id, userData);
        } else {
            storage.saveUser(userData);
        }
        loadAllData();
    };

    const handleUserDelete = (id) => {
        if (confirm('Remove this user access?')) {
            storage.deleteUser(id);
            loadAllData();
        }
    };

    const handleReferralSave = (refData) => {
        storage.saveReferral(refData);
        loadAllData();
    };

    const handleReferralDelete = (id) => {
        if (confirm('Delete this referral?')) {
            storage.deleteReferral(id);
            loadAllData();
        }
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result;
            storage.saveSettings({ signature: base64 });
            loadAllData();
            alert('Signature uploaded!');
        };
        reader.readAsDataURL(file);
    };

    const handleDeleteSignature = () => {
        storage.saveSettings({ signature: null });
        loadAllData();
    };

    const handleExport = () => storage.exportBackup();

    const handleImport = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const backup = JSON.parse(ev.target.result);
                if (confirm('Restore backup? Current data will be replaced.')) {
                    localStorage.setItem('lis_patients', JSON.stringify(backup.patients || []));
                    localStorage.setItem('lis_orders', JSON.stringify(backup.orders || []));
                    localStorage.setItem('lis_users', JSON.stringify(backup.users || []));
                    localStorage.setItem('lis_referrals', JSON.stringify(backup.referrals || []));
                    localStorage.setItem('lis_settings', JSON.stringify(backup.settings || {})); // Restore settings too
                    alert('Restored! Reloading...');
                    window.location.reload();
                }
            } catch (err) {
                alert('Invalid backup file');
            }
        };
        reader.readAsText(file);
    };

    const handleFactoryReset = () => {
        storage.factoryReset();
        setTimeout(() => window.location.reload(), 500);
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
        { id: 'employees', label: 'Employee Management', icon: Users },
        { id: 'referrals', label: 'Referral Management', icon: UserPlus },
        { id: 'config', label: 'Lab Configuration', icon: Settings },
        { id: 'data', label: 'Data Management', icon: Database },
    ];

    return (

        <div className="max-w-7xl mx-auto pb-12">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Shield className="mr-3 h-8 w-8 text-indigo-600" />
                        Admin & Security Control
                    </h1>
                    <p className="text-slate-500">System management, access logs, and data security. <span className="text-xs bg-slate-100 px-2 py-0.5 rounded ml-2">v1.3</span></p>
                </div>
                <button
                    onClick={() => setIsAuthenticated(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 font-medium flex items-center text-sm"
                >
                    <Lock className="h-4 w-4 mr-2" /> Lock Console
                </button>
            </header>

            {/* Navigation Tabs (Pills) */}
            <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl mb-8 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id
                            ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                            }`}
                    >
                        <tab.icon className={`h-4 w-4 mr-2 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'dashboard' && <DashboardView stats={data.stats} logs={data.logs} />}
                {activeTab === 'employees' && <EmployeeManagement users={data.users} onSave={handleUserSave} onDelete={handleUserDelete} onEdit={/* Logic handled in component state, but needs connection */ null} />}
                {activeTab === 'referrals' && <ReferralManagement referrals={data.referrals} onSave={handleReferralSave} onDelete={handleReferralDelete} />}
                {activeTab === 'config' && <LabConfiguration signature={data.signature} onUpload={handleSignatureUpload} onDeleteSignature={handleDeleteSignature} />}
                {activeTab === 'data' && <DataManagement onExport={handleExport} onImport={handleImport} onFactoryReset={handleFactoryReset} />}
            </div>
        </div>
    );
};

export default Admin;

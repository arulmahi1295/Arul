import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Phone, Calendar, MapPin, User, Clock, CheckCircle, Car,
    FileText, Search, Plus, Filter, Navigation, MoreVertical,
    Shield, ArrowRight, X, UserPlus, Trash2, ChevronRight, Activity
} from 'lucide-react';
import { storage } from '../data/storage';

const HomeCollection = () => {
    const navigate = useNavigate();
    const [collections, setCollections] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [users, setUsers] = useState([]); // Phlebotomists
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'history'
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        altPhone: '',
        address: '',
        scheduledTime: '',
        phlebotomist: '',
        referral: '',
        prescription: null
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [cols, refs, emps] = await Promise.all([
            storage.getHomeCollections(),
            storage.getReferrals(),
            storage.getUsers()
        ]);
        setCollections(cols);
        setReferrals(refs);
        setUsers(emps.filter(u => {
            const role = u.role?.toLowerCase() || '';
            return role === 'phlebotomist' || role === 'staff' || role === 'admin';
        }));
        setLoading(false);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) {
                alert("File too large! Please upload an image under 500KB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, prescription: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        await storage.saveHomeCollection(formData);
        setIsAddOpen(false);
        setFormData({ name: '', phone: '', altPhone: '', address: '', scheduledTime: '', phlebotomist: '', referral: '', prescription: null });
        loadData();
    };

    const handleStatusUpdate = async (id, newStatus, phlebo = null) => {
        const updates = { status: newStatus };
        if (phlebo) updates.phlebotomist = phlebo;
        await storage.updateHomeCollection(id, updates);
        loadData();
    };

    // Derived Logic
    const stats = useMemo(() => {
        const total = collections.length;
        const pending = collections.filter(c => c.status === 'Scheduled').length;
        const assigned = collections.filter(c => c.status === 'Assigned').length;
        const completed = collections.filter(c => c.status === 'Completed').length;
        return { total, pending, assigned, completed };
    }, [collections]);

    const phlebotomists = useMemo(() => {
        return users.map(u => u.name);
    }, [users]);

    const filteredCollections = collections.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.phone.includes(searchTerm) ||
            item.id.toLowerCase().includes(searchTerm.toLowerCase());
        const isHistory = item.status === 'Completed' || item.status === 'Cancelled';

        if (activeTab === 'active') return !isHistory && matchesSearch;
        return isHistory && matchesSearch;
    }).sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));

    const getStatusStep = (status) => {
        switch (status) {
            case 'Scheduled': return 1;
            case 'Assigned': return 2;
            case 'On Way': return 3;
            case 'Collected': return 4;
            case 'Completed': return 5;
            default: return 1;
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
            {/* Header & Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 space-y-2">
                    <h1 className="text-3xl font-bold font-display text-slate-800 tracking-tight">Home Collections</h1>
                    <p className="text-slate-500">Manage field logistics and phlebotomy assignments.</p>
                </div>

                {/* Stats Widgets */}
                <div className="lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg shadow-indigo-500/5 hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Activity className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800">{stats.total}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Requests</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg shadow-amber-500/5 hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                <Clock className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800">{stats.pending}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg shadow-blue-500/5 hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <Car className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800">{stats.assigned}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned</p>
                    </div>
                    <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-lg shadow-emerald-500/5 hover:transform hover:scale-105 transition-all duration-300">
                        <div className="flex justify-between items-start mb-2">
                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                <CheckCircle className="h-5 w-5" />
                            </div>
                            <span className="text-2xl font-bold text-slate-800">{stats.completed}</span>
                        </div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white/80 backdrop-blur-lg p-2 rounded-2xl shadow-sm border border-slate-200/60 sticky top-4 z-20">
                <div className="flex p-1 bg-slate-100/80 rounded-xl">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'active' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Active Queue
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        History
                    </button>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddOpen(true)}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        New Request
                    </button>
                </div>
            </div>

            {/* New Request Modal */}
            {isAddOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-xl text-slate-800 flex items-center">
                                <Car className="h-6 w-6 mr-3 text-indigo-600" />
                                Book Home Collection
                            </h3>
                            <button onClick={() => setIsAddOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors"><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAdd} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Patient Details</label>
                                    <input required type="text" placeholder="Full Name" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-bold" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contact Info</label>
                                    <input required type="tel" placeholder="Phone Number" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-medium" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pickup Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <textarea required rows="2" placeholder="Full Address with Landmark" className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none text-sm resize-none" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Schedule Time</label>
                                    <input required type="datetime-local" className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-indigo-500 outline-none font-medium" value={formData.scheduledTime} onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Referral (Optional)</label>
                                    <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium" value={formData.referral} onChange={e => setFormData({ ...formData, referral: e.target.value })}>
                                        <option value="">Select Doctor / Hospital</option>
                                        {referrals.map(ref => (
                                            <option key={ref.id} value={ref.name}>{ref.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Assign Phlebotomist</label>
                                    <select className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 outline-none font-medium" value={formData.phlebotomist} onChange={e => setFormData({ ...formData, phlebotomist: e.target.value })}>
                                        <option value="">Assign Later</option>
                                        {users.map(u => (
                                            <option key={u.id} value={u.name}>{u.name} ({u.role})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsAddOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200">Confirm Booking</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                {filteredCollections.length === 0 ? (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Car className="h-10 w-10 text-slate-300" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">No Requests Found</h3>
                        <p className="text-slate-500 mb-6">There are no home collection requests in this view.</p>
                        <button onClick={() => setIsAddOpen(true)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-indigo-600 hover:bg-slate-50">Create First Request</button>
                    </div>
                ) : (
                    filteredCollections.map(item => {
                        const step = getStatusStep(item.status);
                        return (
                            <div key={item.id} className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                {/* Gradient Status Bar */}
                                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${item.status === 'Completed' ? 'from-emerald-400 to-teal-500' :
                                    item.status === 'Assigned' || item.status === 'On Way' ? 'from-blue-400 to-indigo-500' :
                                        'from-amber-400 to-orange-500'
                                    }`}></div>

                                <div className="flex justify-between items-start mb-6 mt-2">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-800 font-bold text-lg shadow-inner">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{item.name}</h3>
                                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest">{item.id}</p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"><MoreVertical size={20} /></button>
                                    </div>
                                </div>

                                {/* Workflow Stepper */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 1 ? 'text-indigo-600' : 'text-slate-300'}`}>Booked</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 2 ? 'text-indigo-600' : 'text-slate-300'}`}>Assign</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 4 ? 'text-indigo-600' : 'text-slate-300'}`}>Pickup</span>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${step >= 5 ? 'text-emerald-600' : 'text-slate-300'}`}>Done</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className={`h-full bg-indigo-500 transition-all duration-500 ${step === 1 ? 'w-[25%]' : step === 2 ? 'w-[50%]' : step >= 4 ? 'w-[75%]' : 'w-[100%]'} ${step === 5 ? 'bg-emerald-500' : ''}`}></div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <MapPin className="h-5 w-5 text-slate-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-sm text-slate-600 leading-snug font-medium">{item.address}</p>
                                            <a
                                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.address)}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center mt-1 uppercase tracking-wide"
                                            >
                                                Open in Maps <ArrowRight className="h-3 w-3 ml-1" />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                                        <div>
                                            <p className="text-sm font-bold text-slate-700">{new Date(item.scheduledTime).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-slate-400 shrink-0" />
                                        <a href={`tel:${item.phone}`} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">{item.phone}</a>
                                    </div>
                                </div>

                                {/* Assignment Section */}
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-slate-400 uppercase">Phlebotomist</span>
                                        {item.status !== 'Completed' && (
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.phlebotomist ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-600'}`}>
                                                {item.phlebotomist ? 'ASSIGNED' : 'UNASSIGNED'}
                                            </span>
                                        )}
                                    </div>
                                    {item.status !== 'Completed' ? (
                                        <div className="relative">
                                            <select
                                                className="w-full bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2.5 outline-none focus:border-indigo-500 font-medium appearance-none"
                                                value={item.phlebotomist || ''}
                                                onChange={(e) => handleStatusUpdate(item.id, 'Assigned', e.target.value)}
                                            >
                                                <option value="">Select Staff Member...</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.name}>{u.name}</option>
                                                ))}
                                            </select>
                                            <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs">
                                                {item.phlebotomist ? item.phlebotomist.charAt(0) : 'U'}
                                            </div>
                                            <span className="text-sm font-bold text-slate-700">{item.phlebotomist || 'Unknown'}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                {item.status !== 'Completed' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
                                        {item.status === 'Scheduled' && (
                                            <button
                                                onClick={() => handleStatusUpdate(item.id, 'Assigned')}
                                                className="flex-1 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 text-sm transition-colors"
                                            >
                                                Assign
                                            </button>
                                        )}
                                        {item.status === 'Assigned' && (
                                            <button
                                                onClick={() => handleStatusUpdate(item.id, 'On Way')}
                                                className="flex-1 py-2.5 bg-indigo-50 text-indigo-600 font-bold rounded-xl hover:bg-indigo-100 text-sm transition-colors"
                                            >
                                                Departed
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleStatusUpdate(item.id, 'Completed')}
                                            className="flex-1 py-2.5 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 text-sm shadow-lg shadow-emerald-200 transition-all flex items-center justify-center"
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" /> Complete
                                        </button>
                                    </div>
                                )}
                                {item.status === 'Completed' && (
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <button
                                            onClick={() => navigate('/phlebotomy', { state: { homeCollection: item } })}
                                            className="w-full py-2.5 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 text-sm shadow-lg shadow-violet-200 transition-all flex items-center justify-center"
                                        >
                                            <FileText className="h-4 w-4 mr-2" /> Process Order & Accession
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default HomeCollection;

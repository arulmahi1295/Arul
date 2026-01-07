import React, { useState, useEffect } from 'react';
import { Home, Phone, Calendar, MapPin, User, Clock, CheckCircle, Car, FileText } from 'lucide-react';
import { storage } from '../data/storage';

const HomeCollection = () => {
    const [collections, setCollections] = useState([]);
    const [referrals, setReferrals] = useState([]);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        altPhone: '',
        address: '',
        scheduledTime: '',
        phlebotomist: '',
        referral: '', // Store referral name or ID
        prescription: null // Store base64 string
    });

    useEffect(() => {
        loadCollections();
    }, []);

    const loadCollections = async () => {
        setCollections(await storage.getHomeCollections());
        setReferrals(await storage.getReferrals());
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 500000) { // Limit to 500KB for localStorage safety
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
        loadCollections();
    };

    const handleStatusUpdate = async (id, newStatus) => {
        await storage.updateHomeCollection(id, { status: newStatus });
        loadCollections();
    };

    return (
        <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center">
                        <Car className="mr-3 h-8 w-8 text-indigo-600" />
                        Home Collection Management
                    </h1>
                    <p className="text-slate-500">Manage sample collection visits and phlebotomist assignments.</p>
                </div>
                <button
                    onClick={() => setIsAddOpen(!isAddOpen)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center shadow-sm"
                >
                    {isAddOpen ? 'Cancel' : '+ New Request'}
                </button>
            </header>

            {isAddOpen && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 animate-in slide-in-from-top-4">
                    <h3 className="font-bold text-slate-800 mb-4">Book Home Collection</h3>
                    <form onSubmit={handleAdd} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Patient Name</label>
                                <input required type="text" className="w-full px-4 py-2 rounded-xl border border-slate-300" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <input required type="tel" className="w-full px-4 py-2 rounded-xl border border-slate-300" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Alt. Phone Number</label>
                                <input type="tel" className="w-full px-4 py-2 rounded-xl border border-slate-300" value={formData.altPhone} onChange={e => setFormData({ ...formData, altPhone: e.target.value })} placeholder="Optional" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <textarea required rows="2" className="w-full px-4 py-2 rounded-xl border border-slate-300" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Scheduled Time</label>
                                <input required type="datetime-local" className="w-full px-4 py-2 rounded-xl border border-slate-300" value={formData.scheduledTime} onChange={e => setFormData({ ...formData, scheduledTime: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign Phlebotomist</label>
                                <input type="text" className="w-full px-4 py-2 rounded-xl border border-slate-300" value={formData.phlebotomist} onChange={e => setFormData({ ...formData, phlebotomist: e.target.value })} placeholder="Optional" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Referral</label>
                                <select
                                    className="w-full px-4 py-2 rounded-xl border border-slate-300 bg-white"
                                    value={formData.referral}
                                    onChange={e => setFormData({ ...formData, referral: e.target.value })}
                                >
                                    <option value="">Select Referral (Optional)</option>
                                    {referrals.map(ref => (
                                        <option key={ref.id} value={ref.name}>
                                            {ref.name} ({ref.type})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Prescription</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                />
                                <p className="text-xs text-slate-400 mt-1">Images only (Max 500KB)</p>
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">Schedule Visit</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {collections.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                        No home collections scheduled.
                    </div>
                ) : (
                    collections.map(item => (
                        <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mr-3">
                                            <Home className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">{item.name}</h3>
                                            <p className="text-xs text-slate-500 font-mono">{item.id}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold ${item.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                        item.status === 'Assigned' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="space-y-3 text-sm text-slate-600">
                                    <div className="flex items-center">
                                        <Phone className="h-4 w-4 mr-2 text-slate-400" />
                                        {item.phone}
                                        {item.altPhone && <span className="text-slate-400 ml-2 text-xs">/ {item.altPhone}</span>}
                                    </div>
                                    {item.referral && (
                                        <div className="flex items-center text-slate-500">
                                            <User className="h-4 w-4 mr-2 text-slate-400" />
                                            Referral: <span className="font-medium ml-1 text-slate-700">{item.referral}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center">
                                        <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                                        <span className="truncate">{item.address}</span>
                                    </div>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-2 text-slate-400" />
                                        {new Date(item.scheduledTime).toLocaleString()}
                                    </div>
                                    {item.phlebotomist && (
                                        <div className="flex items-center text-indigo-600 font-medium">
                                            <User className="h-4 w-4 mr-2" />
                                            {item.phlebotomist}
                                        </div>
                                    )}
                                    {item.prescription && (
                                        <div className="pt-2">
                                            <button
                                                onClick={() => {
                                                    const newWindow = window.open();
                                                    if (newWindow) newWindow.document.write(`<img src="${item.prescription}" style="max-width:100%;" />`);
                                                }}
                                                className="text-xs flex items-center text-indigo-600 hover:text-indigo-800 underline"
                                            >
                                                <FileText className="h-3 w-3 mr-1" /> View Prescription
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex justify-between items-center">
                                {item.status !== 'Completed' && (
                                    <button
                                        onClick={() => handleStatusUpdate(item.id, 'Completed')}
                                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center"
                                    >
                                        <CheckCircle className="h-4 w-4 mr-1" /> Mark Complete
                                    </button>
                                )}
                                {item.status === 'Scheduled' && (
                                    <button
                                        onClick={() => handleStatusUpdate(item.id, 'Assigned')}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700"
                                    >
                                        Mark Assigned
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HomeCollection;

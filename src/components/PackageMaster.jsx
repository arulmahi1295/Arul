import React, { useState, useMemo } from 'react';
import { useTests } from '../contexts/TestContext';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { Search, Plus, Trash2, Edit2, Save, X, AlertCircle, Package, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { storage } from '../data/storage';

const PackageMaster = () => {
    const { tests, packages, refreshTests } = useTests(); // packages now available from context
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        price: '',
        description: '',
        selectedTestIds: [] // Array of test IDs
    });

    const [testSearch, setTestSearch] = useState('');

    // Derived State for Form
    const selectedTestsList = useMemo(() => {
        return formData.selectedTestIds.map(id => tests.find(t => t.id === id)).filter(Boolean);
    }, [formData.selectedTestIds, tests]);

    const totalMRP = selectedTestsList.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
    const totalL2L = selectedTestsList.reduce((sum, t) => sum + (parseFloat(t.l2lPrice) || 0), 0);
    const packagePrice = parseFloat(formData.price) || 0;

    // Profit Calculations
    const profit = Math.max(0, packagePrice - totalL2L);
    const margin = packagePrice > 0 ? Math.round((profit / packagePrice) * 100) : 0;

    const discountAmount = Math.max(0, totalMRP - packagePrice);
    const discountPercent = totalMRP > 0 ? Math.round((discountAmount / totalMRP) * 100) : 0;

    // Reset Form
    const resetForm = () => {
        setFormData({
            id: '',
            name: '',
            price: '',
            description: '',
            selectedTestIds: []
        });
        setTestSearch('');
        setEditingPackage(null);
        setIsModalOpen(false);
        setMessage(null);
    };

    // Open Modal (New or Edit)
    const handleOpenModal = (pkg = null) => {
        if (pkg) {
            setEditingPackage(pkg);
            setFormData({
                id: pkg.id,
                name: pkg.name,
                price: pkg.price,
                description: pkg.description || '',
                selectedTestIds: pkg.tests || []
            });
        } else {
            setFormData({
                id: `PKG-${Math.floor(1000 + Math.random() * 9000)}`,
                name: '',
                price: '',
                description: '',
                selectedTestIds: []
            });
        }
        setIsModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async (pkgId) => {
        if (!confirm('Are you sure you want to delete this package?')) return;
        try {
            await storage.deletePackage(pkgId);
            setMessage({ type: 'success', text: 'Package deleted successfully.' });
            refreshTests(); // Reloads packages too
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: 'Failed to delete package.' });
        }
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            if (!formData.name || !formData.price || formData.selectedTestIds.length === 0) {
                throw new Error("Name, Price, and at least one test are required.");
            }

            const payload = {
                id: formData.id,
                name: formData.name,
                price: parseFloat(formData.price),
                description: formData.description,
                tests: formData.selectedTestIds,
                type: 'package',
                updatedAt: new Date().toISOString()
            };

            await storage.savePackage(payload);
            setMessage({ type: 'success', text: editingPackage ? 'Package updated successfully.' : 'Package created successfully.' });
            refreshTests();
            resetForm();
        } catch (error) {
            console.error(error);
            setMessage({ type: 'error', text: error.message || 'Failed to save package.' });
        } finally {
            setSaving(false);
        }
    };

    // Toggle Test Selection
    const toggleTest = (testId) => {
        setFormData(prev => {
            if (prev.selectedTestIds.includes(testId)) {
                return { ...prev, selectedTestIds: prev.selectedTestIds.filter(id => id !== testId) };
            } else {
                return { ...prev, selectedTestIds: [...prev.selectedTestIds, testId] };
            }
        });
    };

    // Filter available tests for selection
    const availableTests = tests.filter(t =>
        t.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        t.code.toLowerCase().includes(testSearch.toLowerCase())
    );

    // List Filtering
    const filteredPackages = (packages || []).filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-in fade-in duration-500">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold font-display text-slate-800">Health Packages</h2>
                    <p className="text-slate-500 text-sm">Create bundled test packages with special pricing</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
                >
                    <Plus className="h-4 w-4 mr-2" /> Create Package
                </button>
            </div>

            {message && (
                <div className={`p-4 mb-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    <AlertCircle size={20} />
                    <span>{message.text}</span>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPackages.map(pkg => {
                    const pkgTests = pkg.tests.map(id => tests.find(t => t.id === id)).filter(Boolean);
                    const pkgMRP = pkgTests.reduce((sum, t) => sum + (parseFloat(t.price) || 0), 0);
                    const pkgL2L = pkgTests.reduce((sum, t) => sum + (parseFloat(t.l2lPrice) || 0), 0);
                    const pkgPrice = parseFloat(pkg.price) || 0;

                    const savings = Math.max(0, pkgMRP - pkgPrice);
                    const profit = pkgPrice - pkgL2L;
                    const margin = pkgPrice > 0 ? Math.round((profit / pkgPrice) * 100) : 0;

                    return (
                        <div key={pkg.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 relative group hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleOpenModal(pkg)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button onClick={() => handleDelete(pkg.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1">{pkg.name}</h3>
                            <p className="text-xs text-slate-500 mb-4 line-clamp-2">{pkg.description || 'No description provided.'}</p>

                            <div className="flex flex-col gap-1 mb-4">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-2xl font-bold text-slate-800">₹{pkg.price}</span>
                                    {pkgMRP > pkg.price && (
                                        <>
                                            <span className="text-sm text-slate-400 line-through">₹{pkgMRP}</span>
                                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                Save ₹{savings}
                                            </span>
                                        </>
                                    )}
                                </div>

                                {/* Profitability Pill */}
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-md border ${profit > 0 ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                        Profit: ₹{profit} ({margin}%)
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        (Cost: ₹{pkgL2L})
                                    </span>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-3">
                                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Includes {pkg.tests.length} Tests</p>
                                <div className="flex flex-wrap gap-1">
                                    {pkgTests.slice(0, 3).map(t => (
                                        <span key={t.id} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
                                            {t.name}
                                        </span>
                                    ))}
                                    {pkgTests.length > 3 && (
                                        <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-1 rounded-md">
                                            +{pkgTests.length - 3} more
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {filteredPackages.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>No packages found. Create your first health package!</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center">
                                <Package className="h-5 w-5 mr-2 text-indigo-600" />
                                {editingPackage ? 'Edit Package' : 'New Health Package'}
                            </h3>
                            <button type="button" onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {/* Basic Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Package Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-bold text-lg"
                                        placeholder="e.g. Master Health Checkup"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none h-20 resize-none text-sm"
                                        placeholder="What's included in this package..."
                                    />
                                </div>
                            </div>

                            {/* Test Selection */}
                            <div className="border rounded-xl border-slate-200 overflow-hidden">
                                <div className="bg-slate-50 p-3 border-b border-slate-200 flex justify-between items-center">
                                    <h4 className="font-bold text-slate-700 text-sm">Included Tests ({formData.selectedTestIds.length})</h4>
                                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded font-bold">MRP Total: ₹{totalMRP}</span>
                                </div>
                                <div className="p-3 border-b border-slate-200">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search tests to add..."
                                            value={testSearch}
                                            onChange={e => setTestSearch(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:border-indigo-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="h-48 overflow-y-auto p-2 bg-slate-50/30">
                                    {availableTests.map(test => {
                                        const isSelected = formData.selectedTestIds.includes(test.id);
                                        // Only show selected tests OR search results
                                        if (!isSelected && !testSearch && formData.selectedTestIds.length > 0) return null;
                                        if (testSearch && !test.name.toLowerCase().includes(testSearch.toLowerCase()) && !test.code.toLowerCase().includes(testSearch.toLowerCase())) return null;

                                        return (
                                            <div
                                                key={test.id}
                                                onClick={() => toggleTest(test.id)}
                                                className={`flex items-center justify-between p-2 rounded-lg mb-1 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50 border border-indigo-200' : 'hover:bg-slate-100 border border-transparent'}`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center mr-3 ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                                                        {isSelected && <Check className="h-3 w-3 text-white" />}
                                                    </div>
                                                    <div>
                                                        <p className={`text-sm ${isSelected ? 'font-bold text-indigo-900' : 'text-slate-700'}`}>{test.name}</p>
                                                        <p className="text-[10px] text-slate-400">{test.code}</p>
                                                    </div>
                                                </div>
                                                <span className="text-xs font-mono text-slate-500">₹{test.price}</span>
                                            </div>
                                        );
                                    })}
                                    {testSearch && availableTests.filter(t => t.name.toLowerCase().includes(testSearch.toLowerCase())).length === 0 && (
                                        <p className="text-center text-xs text-slate-400 py-4">No tests found.</p>
                                    )}
                                    {!testSearch && formData.selectedTestIds.length > 0 && (
                                        <p className="text-center text-xs text-slate-400 py-2 border-t border-slate-100 mt-2">Use search to add more tests.</p>
                                    )}
                                </div>
                            </div>

                            {/* Pricing */}
                            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex items-center justify-between">
                                <div>
                                    <label className="block text-xs font-bold text-indigo-800 mb-1 uppercase tracking-wider">Package Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-32 p-2 rounded-lg border border-indigo-200 focus:border-indigo-500 outline-none font-bold text-xl text-indigo-700"
                                        placeholder="0"
                                    />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-indigo-500 font-bold uppercase">Discount</p>
                                    <p className="text-lg font-bold text-indigo-900">{discountPercent}% OFF</p>
                                    <p className="text-xs text-indigo-400">Save ₹{discountAmount}</p>
                                </div>
                            </div>

                            {/* Profitability Analysis in Form */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-xs text-slate-500 font-bold uppercase mb-1">Total Cost (L2L)</p>
                                    <p className="text-lg font-bold text-slate-700">₹{totalL2L}</p>
                                    <p className="text-[10px] text-slate-400">Sum of B2B prices</p>
                                </div>
                                <div className={`p-3 rounded-xl border ${profit > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                                    <p className={`text-xs font-bold uppercase mb-1 ${profit > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>Net Profit</p>
                                    <div className="flex items-baseline justify-between">
                                        <p className={`text-lg font-bold ${profit > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>₹{profit}</p>
                                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${profit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                            {margin}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                            >
                                {saving ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Package</>}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default PackageMaster;

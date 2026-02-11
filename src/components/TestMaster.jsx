import React, { useState, useMemo } from 'react';
import { useTests } from '../contexts/TestContext';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { Search, Plus, Trash2, Edit2, Save, X, AlertCircle, Beaker, Tag, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { logAdmin } from '../utils/activityLogger';

const TestMaster = () => {
    const { tests, loading, refreshTests } = useTests();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTest, setEditingTest] = useState(null);
    const [saving, setSaving] = useState(false);
    const [importing, setImporting] = useState(false);
    const [message, setMessage] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        category: 'BIOCHEMISTRY',
        price: '',
        l2lPrice: '',
        color: 'bg-slate-100 text-slate-700'
    });

    // Reset Form
    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            category: 'BIOCHEMISTRY',
            price: '',
            l2lPrice: '',
            color: 'bg-slate-100 text-slate-700'
        });
        setEditingTest(null);
        setIsModalOpen(false);
        setMessage(null);
    };

    // Open Modal for Edit
    const handleEditClick = (test) => {
        setEditingTest(test);
        setFormData({
            code: test.code,
            name: test.name,
            category: test.category || 'BIOCHEMISTRY',
            price: test.price || 0,
            l2lPrice: test.l2lPrice || 0,
            color: test.color || 'bg-slate-100 text-slate-700'
        });
        setIsModalOpen(true);
    };

    // Handle Delete
    const handleDelete = async (testId) => {
        if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) return;

        try {
            await deleteDoc(doc(db, 'tests', testId));
            setMessage({ type: 'success', text: 'Test deleted successfully.' });
            refreshTests();
        } catch (error) {
            console.error(error);
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                setMessage({ type: 'error', text: 'Permission Denied: Ask Admin to check Firestore Rules.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to delete test.' });
            }
        }
    };

    // Handle Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const testId = editingTest ? editingTest.id : formData.code.replace(/\//g, '_');

            // Basic Validation
            if (!formData.code || !formData.name) {
                throw new Error("Code and Name are required.");
            }

            const payload = {
                code: formData.code,
                name: formData.name,
                category: formData.category,
                price: parseFloat(formData.price) || 0,
                l2lPrice: parseFloat(formData.l2lPrice) || 0,
                color: formData.color,
                updatedAt: new Date().toISOString()
            };

            // Detect Price Changes for Logging
            if (editingTest) {
                const oldPrice = parseFloat(editingTest.price) || 0;
                const newPrice = payload.price;
                const oldL2L = parseFloat(editingTest.l2lPrice) || 0;
                const newL2L = payload.l2lPrice;

                const changes = [];
                if (oldPrice !== newPrice) changes.push(`MRP: ₹${oldPrice} -> ₹${newPrice}`);
                if (oldL2L !== newL2L) changes.push(`L2L: ₹${oldL2L} -> ₹${newL2L}`);

                if (changes.length > 0) {
                    await logAdmin.pricingUpdated(payload.name, changes.join(', '));
                }
            } else {
                // New Test - optional to log as pricing update, usually covered by USER_CREATED or similar, but let's be explicit if needed.
                // Actually relying on the generic 'Settings Changed' or just assume creation log is enough. 
                // But wait, TestMaster allows creation. 
                // Let's log it if price > 0
                if (payload.price > 0 || payload.l2lPrice > 0) {
                    await logAdmin.pricingUpdated(payload.name, `Initial Price: MRP ₹${payload.price}, L2L ₹${payload.l2lPrice}`);
                }
            }

            // If creating new, set ID same as code (sanitized)
            await setDoc(doc(db, 'tests', testId), payload, { merge: true });

            setMessage({ type: 'success', text: editingTest ? 'Test updated successfully.' : 'Test created successfully.' });
            refreshTests();
            resetForm();
        } catch (error) {
            console.error(error);
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                setMessage({ type: 'error', text: 'Permission Denied: Ask Admin to check Firestore Rules.' });
            } else {
                setMessage({ type: 'error', text: error.message || 'Failed to save test.' });
            }
        } finally {
            setSaving(false);
        }
    };

    // Bulk Import Logic
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImporting(true);
        setMessage(null);

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) throw new Error("File appears empty");

                const batch = writeBatch(db);
                let updateCount = 0;
                let newCount = 0; // Tracking for potential new tests (feature expansion) - currently strictly updates

                data.forEach(row => {
                    // Normalize keys
                    const rowNormalized = {};
                    Object.keys(row).forEach(k => rowNormalized[k.toLowerCase().trim()] = row[k]);

                    const code = rowNormalized['test code'] || rowNormalized['code'] || rowNormalized['id'];
                    const name = rowNormalized['test name'] || rowNormalized['name'] || rowNormalized['test'];
                    const l2lPrice = rowNormalized['l2l price'] || rowNormalized['cost'] || rowNormalized['b2b price'] || rowNormalized['b2b'] || rowNormalized['l2l']; // Added l2l check
                    const mrp = rowNormalized['mrp'] || rowNormalized['price'];

                    // Skip if no identifying info
                    if (!code && !name) return;

                    // Strategy 1: Match by Code
                    let existingTest = null;
                    if (code) {
                        existingTest = tests.find(t => t.code?.toString().toUpperCase() === code.toString().toUpperCase());
                    }

                    // Strategy 2: Match by Name (Fallback)
                    if (!existingTest && name) {
                        existingTest = tests.find(t => t.name?.toLowerCase().trim() === name.toString().toLowerCase().trim());
                    }

                    if (existingTest) {
                        // Sanitize ID: Firestore IDs cannot contain slashes. If existingTest.id has slashes,
                        // it must be sanitized to match the actual document ID.
                        const safeId = existingTest.id.toString().replace(/\//g, '_');
                        const testRef = doc(db, 'tests', safeId);
                        const updates = {};

                        // Parse numbers carefully
                        if (l2lPrice !== undefined) {
                            const parsedL2L = parseFloat(l2lPrice);
                            if (!isNaN(parsedL2L)) updates.l2lPrice = parsedL2L;
                        }

                        if (mrp !== undefined) {
                            const parsedPrice = parseFloat(mrp);
                            if (!isNaN(parsedPrice)) updates.price = parsedPrice;
                        }

                        if (Object.keys(updates).length > 0) {
                            batch.update(testRef, updates);
                            updateCount++;
                        }
                    }
                });

                if (updateCount > 0) {
                    await batch.commit();
                    setMessage({ type: 'success', text: `Successfully updated ${updateCount} tests.` });
                    await logAdmin.pricingUpdated('Bulk Import', `Updated ${updateCount} tests via Excel upload`);
                    refreshTests();
                } else {
                    setMessage({ type: 'info', text: 'No matching tests found to update.' });
                }

            } catch (error) {
                console.error("Import Error", error);
                if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                    setMessage({ type: 'error', text: 'Permission Denied: Ask Admin to check Firestore Rules.' });
                } else {
                    setMessage({ type: 'error', text: `Import Failed: ${error.message}` });
                }
            } finally {
                setImporting(false);
                e.target.value = null; // Reset input
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadTemplate = () => {
        const template = [
            ['Test Code', 'Test Name', 'Category', 'Price', 'L2L Price'],
            ...tests.map(t => [t.code, t.name, t.category, t.price, t.l2lPrice || 0])
        ];
        const ws = XLSX.utils.aoa_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Test_Master_Template");
        XLSX.writeFile(wb, "Test_Master_Template.xlsx");
    };


    // Filtering
    const filteredTests = useMemo(() => {
        return tests.filter(t =>
            t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [tests, searchTerm]);

    // Categories for Dropdown
    const categories = useMemo(() => {
        const cats = new Set(tests.map(t => t.category).filter(Boolean));
        return Array.from(cats).sort();
    }, [tests]);

    if (loading) return <div className="p-8 text-center text-slate-500">Loading Test Master...</div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold font-display text-slate-800">Test Master</h2>
                    <p className="text-slate-500 text-sm">Manage lab tests, prices, and categories</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 flex items-center shadow-sm"
                        title="Download Template"
                    >
                        <Download className="h-4 w-4 mr-2" /> Template
                    </button>
                    <label className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 flex items-center shadow-lg shadow-emerald-200 cursor-pointer transition-colors">
                        {importing ? 'Importing...' : <><Upload className="h-4 w-4 mr-2" /> Import Excel</>}
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" disabled={importing} />
                    </label>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 flex items-center shadow-lg shadow-indigo-200"
                    >
                        <Plus className="h-4 w-4 mr-2" /> Add New Test
                    </button>
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : message.type === 'info' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                    <AlertCircle size={20} />
                    <span>{message.text}</span>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search tests by name or code..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Code</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Test Name</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase">Category</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">MRP</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">L2L Price</th>
                                <th className="p-4 text-xs font-bold text-slate-500 uppercase text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTests.map(test => (
                                <tr key={test.id} className="hover:bg-slate-50 group">
                                    <td className="p-4 font-mono text-xs font-bold text-slate-500">{test.code}</td>
                                    <td className="p-4 font-medium text-slate-800">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full mr-2 ${test.color ? test.color.split(' ')[0] : 'bg-slate-200'}`}></div>
                                            {test.name}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{test.category}</span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-slate-600">₹{test.price}</td>
                                    <td className="p-4 text-right font-mono text-slate-600">₹{test.l2lPrice}</td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEditClick(test)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(test.id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg" title="Delete">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTests.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-slate-400">
                                        No tests found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400">
                    Showing {filteredTests.length} tests
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center">
                                <Beaker className="h-5 w-5 mr-2 text-indigo-600" />
                                {editingTest ? 'Edit Test' : 'New Test'}
                            </h3>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Test Code (ID)</label>
                                    <input
                                        type="text"
                                        required
                                        disabled={!!editingTest}
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-mono text-sm disabled:bg-slate-100 disabled:text-slate-500"
                                        placeholder="e.g. CBC"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">Category</label>
                                    <input
                                        type="text"
                                        list="categories"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-sm"
                                        placeholder="Select or Type..."
                                    />
                                    <datalist id="categories">
                                        {categories.map(c => <option key={c} value={c} />)}
                                    </datalist>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Test Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-medium"
                                    placeholder="e.g. Complete Blood Count"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">MRP (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-mono"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1">L2L Price (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.l2lPrice}
                                        onChange={e => setFormData({ ...formData, l2lPrice: e.target.value })}
                                        className="w-full p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none font-mono"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Color Theme (Tailwind Classes)</label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="flex-1 p-2.5 rounded-lg border border-slate-200 focus:border-indigo-500 outline-none text-xs font-mono text-slate-500"
                                        placeholder="e.g. bg-red-100 text-red-700"
                                    />
                                    <div className={`h-10 w-10 rounded-lg border border-slate-200 flex items-center justify-center ${formData.color}`}>
                                        <Tag size={16} />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Use standard Tailwind background and text color classes.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
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
                                    {saving ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Test</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TestMaster;

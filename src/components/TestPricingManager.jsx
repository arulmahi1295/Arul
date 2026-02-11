import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useTests } from '../contexts/TestContext';
import { Save, Search, RefreshCw, AlertCircle, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { logAdmin } from '../utils/activityLogger';

const TestPricingManager = () => {
    const { tests, loading, refreshTests } = useTests();
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState(null);
    const [duplicates, setDuplicates] = useState([]);

    // Check for duplicates
    useEffect(() => {
        if (tests.length > 0) {
            // Group by CODE
            const groupsCode = tests.reduce((acc, t) => {
                const c = (t.code || '').trim().toUpperCase();
                if (!c) return acc;
                if (!acc[c]) acc[c] = [];
                acc[c].push(t);
                return acc;
            }, {});

            // Group by NAME
            const groupsName = tests.reduce((acc, t) => {
                const n = (t.name || '').trim().toUpperCase();
                if (!n) return acc;
                if (!acc[n]) acc[n] = [];
                acc[n].push(t);
                return acc;
            }, {});

            const dupGroupsCode = Object.entries(groupsCode)
                .filter(([k, v]) => v.length > 1)
                .map(([k, v]) => ({ type: 'CODE', key: k, items: v }));

            const dupGroupsName = Object.entries(groupsName)
                .filter(([k, v]) => v.length > 1)
                // Filter out if already caught by code to avoid double counting
                .filter(([k, v]) => !dupGroupsCode.some(g => g.items.some(i => i.name.toUpperCase() === k)))
                .map(([k, v]) => ({ type: 'NAME', key: k, items: v }));

            // Combine
            setDuplicates([...dupGroupsCode, ...dupGroupsName]);
        }
    }, [tests]);

    const handleFixDuplicates = async () => {
        if (!window.confirm(`Found ${duplicates.length} sets of duplicates (by Code or Name). Proceed to clean up?`)) return;

        setSaving(true);
        try {
            let deletedCount = 0;
            for (const group of duplicates) {
                // Determine keeper based on heuristics
                const sorted = [...group.items].sort((a, b) => {
                    // 1. Prefer existing L2L price
                    const aPrice = (a.l2lPrice || 0);
                    const bPrice = (b.l2lPrice || 0);
                    if (aPrice !== bPrice) return bPrice - aPrice;

                    // 2. Prefer ID matching Code
                    const aIdMatch = a.id === a.code ? 1 : 0;
                    const bIdMatch = b.id === b.code ? 1 : 0;
                    if (aIdMatch !== bIdMatch) return bIdMatch - aIdMatch;

                    // 3. Updated recently? (assuming updatedAt field exists and is comparable string)
                    if (a.updatedAt && b.updatedAt) return b.updatedAt.localeCompare(a.updatedAt);

                    return 0;
                });

                const [keeper, ...removers] = sorted;
                console.log(`Keeping ${keeper.id} (${keeper.name})`, keeper);

                for (const r of removers) {
                    if (r.id === keeper.id) continue;
                    await deleteDoc(doc(db, 'tests', r.id));
                    deletedCount++;
                }
            }
            setMessage({ type: 'success', text: `Cleanup complete! Removed ${deletedCount} entries.` });
            setDuplicates([]);
            refreshTests();
        } catch (e) {
            console.error(e);
            if (e.code === 'permission-denied' || e.message?.includes('permission-denied')) {
                setMessage({ type: 'error', text: 'Permission Denied: Ask Admin to check Firestore Rules.' });
            } else {
                setMessage({ type: 'error', text: 'Failed to fix duplicates: ' + e.message });
            }
        } finally {
            setSaving(false);
        }
    };

    // Local state to track price edits before saving
    const [editedPrices, setEditedPrices] = useState({});

    const handlePriceChange = (testCode, newPrice) => {
        setEditedPrices(prev => ({
            ...prev,
            [testCode]: newPrice
        }));
    };

    // Excel Export Template
    const handleDownloadTemplate = () => {
        const template = [
            ['Test Code', 'Test Name', 'MRP', 'L2L Cost'],
            ...tests.map(t => [t.code, t.name, t.price, ''])
        ];
        const ws = XLSX.utils.aoa_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "L2L Prices");
        XLSX.writeFile(wb, "L2L_Price_Template.xlsx");
    };

    // Excel Import
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                let matchCount = 0;
                let failCount = 0;
                const newPrices = { ...editedPrices }; // Fix: Use editedPrices, not undefined 'prices'

                data.forEach(row => {
                    // Normalize keys
                    const rowNormalized = {};
                    Object.keys(row).forEach(k => rowNormalized[k.trim().toLowerCase()] = row[k]);

                    // extract code and price
                    let code = rowNormalized['test code'] || rowNormalized['code'];
                    if (code && typeof code === 'string') code = code.trim();

                    let priceRaw = rowNormalized['l2l cost'] || rowNormalized['l2l price'] || rowNormalized['cost'] || rowNormalized['price'];
                    // sanitize price string (remove currency symbols, commas)
                    if (typeof priceRaw === 'string') {
                        priceRaw = priceRaw.replace(/[^0-9.-]/g, '');
                    }
                    const price = parseFloat(priceRaw);

                    if (!isNaN(price)) {
                        let test = null;

                        // Try matching by Code (Case Insensitive)
                        if (code) {
                            test = tests.find(t => t.code.trim().toLowerCase() === code.toString().toLowerCase());
                        }

                        // Try matching by Name if Code fails
                        if (!test && rowNormalized['test name']) {
                            const searchName = rowNormalized['test name'].toString().trim().toLowerCase();
                            test = tests.find(t => t.name.toLowerCase() === searchName);
                        }

                        if (test) {
                            newPrices[test.id] = price;
                            matchCount++;
                        } else {
                            failCount++;
                            console.warn("Could not match row:", row);
                        }
                    }
                });

                setEditedPrices(newPrices);

                if (matchCount > 0) {
                    let msg = `Loaded ${matchCount} prices.`;
                    if (failCount > 0) msg += ` (Skipped ${failCount} rows - check console for details).`;
                    msg += " Click Save to apply.";
                    setMessage({ type: 'success', text: msg });
                } else {
                    setMessage({ type: 'error', text: 'No matching tests found in file. Please check column headers (Need "Test Code" or "Test Name").' });
                }
            } catch (error) {
                console.error(error);
                setMessage({ type: 'error', text: 'Failed to import file. Ensure it is a valid Excel file.' });
            }
        };
        reader.readAsBinaryString(file);
        // Reset input to allow re-upload of same file if needed
        e.target.value = '';
    };

    const savePrices = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const entries = Object.entries(editedPrices);
            const batchSize = 400; // Limit is 500, keeping safety margin
            const chunks = [];

            for (let i = 0; i < entries.length; i += batchSize) {
                chunks.push(entries.slice(i, i + batchSize));
            }

            console.log(`Saving ${entries.length} price updates in ${chunks.length} batches...`);

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(([id, price]) => {
                    // Sanitize ID to match Firestore doc ID (replace slashes with underscores)
                    // e.g. "CD4/8" -> "CD4_8"
                    const safeId = id.toString().replace(/\//g, '_');
                    const ref = doc(db, 'tests', safeId);

                    batch.set(ref, {
                        l2lPrice: parseFloat(price),
                        updatedAt: new Date().toISOString()
                    }, { merge: true });
                });
                await batch.commit();
            }

            // Audit Log
            const count = entries.length;
            if (count > 0) {
                await logAdmin.pricingUpdated('L2L Manager', `Bulk updated L2L costs for ${count} tests`);
            }

            setMessage({ type: 'success', text: 'All prices updated successfully!' });
            refreshTests(); // Reload data from Firestore to reflect changes
            setEditedPrices({});
        } catch (error) {
            console.error("Error saving prices:", error);
            if (error.code === 'permission-denied' || error.message?.includes('permission-denied')) {
                setMessage({ type: 'error', text: 'Permission Denied: Ask Admin to check Firestore Rules.' });
            } else {
                setMessage({ type: 'error', text: `Failed to save prices: ${error.message}` });
            }
        } finally {
            setSaving(false);
        }
    };

    // Filter tests
    const filteredTests = tests.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-display text-slate-800">Test Price Manager (L2L)</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center space-x-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                        title="Download Template"
                    >
                        <Download size={18} />
                        <span className="hidden md:inline">Template</span>
                    </button>
                    <label className="flex items-center space-x-2 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 px-3 py-2 rounded-lg transition-colors cursor-pointer text-sm font-medium">
                        <Upload size={18} />
                        <span className="hidden md:inline">Upload Price List</span>
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>

                    {duplicates.length > 0 && (
                        <button
                            onClick={handleFixDuplicates}
                            className="bg-red-100 text-red-600 hover:bg-red-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 animate-pulse"
                            title="Fix Duplicates"
                        >
                            <AlertCircle size={18} />
                            Fix {duplicates.length} Duplicates
                        </button>
                    )}

                    <button
                        onClick={refreshTests}
                        className="p-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors"
                        title="Refresh Prices"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={savePrices}
                        disabled={saving}
                        className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg shadow-sm transition-colors disabled:opacity-50"
                    >
                        <Save size={18} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                    <AlertCircle size={20} />
                    <span>{message.text}</span>
                </div>
            )}

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search by Test Name or Code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                />
            </div>

            {/* Test List Table */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 font-semibold text-slate-600 w-24">Code</th>
                                <th className="p-4 font-semibold text-slate-600">Test Name</th>
                                <th className="p-4 font-semibold text-slate-600 w-32">MRP (₹)</th>
                                <th className="p-4 font-semibold text-slate-600 w-40">L2L Price (₹)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTests.map((test) => (
                                <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-mono text-sm text-slate-500">{test.code}</td>
                                    <td className="p-4 font-medium text-slate-800">{test.name}</td>
                                    <td className="p-4 text-slate-600">₹{test.price}</td>
                                    <td className="p-4">
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">₹</span>
                                            <input
                                                type="number"
                                                value={editedPrices[test.id] !== undefined ? editedPrices[test.id] : (test.l2lPrice || '')}
                                                onChange={(e) => handlePriceChange(test.id, e.target.value)}
                                                placeholder="0"
                                                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredTests.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-8 text-center text-slate-500">
                                        No tests found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center text-slate-400 text-sm">
                Showing {filteredTests.length} of {tests.length} tests
            </div>
        </div>
    );
};

export default TestPricingManager;

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useTests } from '../contexts/TestContext';
import { Save, Search, RefreshCw, AlertCircle, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { logAdmin } from '../utils/activityLogger';

const TestPricingManager = () => {
    const { tests, loading, refreshTests } = useTests();
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [message, setMessage] = useState(null);

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
                const newPrices = { ...prices };

                data.forEach(row => {
                    const rowNormalized = {};
                    Object.keys(row).forEach(k => rowNormalized[k.toLowerCase().trim()] = row[k]);

                    const code = rowNormalized['test code'] || rowNormalized['code'];
                    const priceRaw = rowNormalized['l2l cost'] || rowNormalized['l2l price'] || rowNormalized['cost'] || rowNormalized['price'];
                    const price = parseFloat(priceRaw);

                    if (!isNaN(price)) {
                        let test = tests.find(t => t.code === code);
                        if (!test && rowNormalized['test name']) {
                            test = tests.find(t => t.name.toLowerCase() === rowNormalized['test name'].toLowerCase());
                        }

                        if (test) {
                            newPrices[test.id] = price;
                            matchCount++;
                        }
                    }
                });

                setEditedPrices(newPrices);
                setMessage({ type: 'success', text: `Imported ${matchCount} prices. Click Save to persist.` });
            } catch (error) {
                console.error(error);
                setMessage({ type: 'error', text: 'Failed to import file. Ensure it is a valid Excel file.' });
            }
        };
        reader.readAsBinaryString(file);
    };

    const savePrices = async () => {
        setSaving(true);
        setMessage(null);
        try {
            // Batch writes are better, but simple setDoc loops are fine for moderate volume 
            // since we only save changed items ideally, but here we save all for simplicity in V1
            // Refinement: Only save what changed. 
            // Better Strategy: Save individual entries on blur or a bulk save.

            const promises = Object.entries(editedPrices).map(([id, price]) =>
                setDoc(doc(db, 'tests', id), { // Update direct test document using ID
                    l2lPrice: parseFloat(price),
                    updatedAt: new Date().toISOString()
                }, { merge: true })
            );

            await Promise.all(promises);

            // Audit Log
            const count = Object.keys(editedPrices).length;
            if (count > 0) {
                await logAdmin.pricingUpdated('L2L Manager', `Bulk updated L2L costs for ${count} tests`);
            }

            setMessage({ type: 'success', text: 'All prices updated successfully!' });
            refreshTests(); // Reload data from Firestore to reflect changes
            setEditedPrices({});
        } catch (error) {
            console.error("Error saving prices:", error);
            setMessage({ type: 'error', text: 'Failed to save prices.' });
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

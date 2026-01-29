import React, { useState, useEffect } from 'react';
import { Search, Save, X, AlertCircle, CheckCircle, RotateCcw, Upload, Download } from 'lucide-react';
import { storage } from '../data/storage';

import { useTests } from '../contexts/TestContext';
import * as XLSX from 'xlsx';
import { logAdmin } from '../utils/activityLogger';

// Component to manage custom prices for a specific referral
const ReferralPriceManager = ({ referral, onClose }) => {
    const { tests } = useTests();
    const [searchTerm, setSearchTerm] = useState('');
    const [customPrices, setCustomPrices] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [globalDiscount, setGlobalDiscount] = useState(0);

    // Initial Load
    useEffect(() => {
        const loadPrices = async () => {
            if (referral?.id) {
                const prices = await storage.getReferralPrices(referral.id);
                setCustomPrices(prices || {});
            }
            setIsLoading(false);
        };
        loadPrices();
    }, [referral]);

    // Handle Individual Price Change
    const handlePriceChange = (testCode, value) => {
        setCustomPrices(prev => ({
            ...prev,
            [testCode]: value === '' ? undefined : parseInt(value)
        }));
    };

    // Apply Global Discount
    const applyGlobalDiscount = () => {
        if (!globalDiscount || globalDiscount <= 0) return;
        if (!confirm(`Apply ${globalDiscount}% discount to ALL tests for ${referral.name}? This will overwrite current custom prices.`)) return;

        const newPrices = {};
        tests.forEach(test => {
            newPrices[test.code] = Math.round(test.price * (1 - globalDiscount / 100));
        });
        setCustomPrices(newPrices);
        setCustomPrices(newPrices);
        setMessage({ type: 'success', text: `Applied ${globalDiscount}% discount to all tests.` });

        // Audit Log
        logAdmin.referralPricingUpdated(referral.name, `Applied global discount of ${globalDiscount}% to all tests`);
    };

    // Excel Export Template
    const handleDownloadTemplate = () => {
        const template = [
            ['Test Code', 'Test Name', 'Base MRP', 'Custom Price'],
            ...tests.map(t => [t.code, t.name, t.price, '']) // Pre-fill catalog for easy editing
        ];
        const ws = XLSX.utils.aoa_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Price List");
        XLSX.writeFile(wb, `Price_Template_${referral.name}.xlsx`);
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
                const newPrices = { ...customPrices };

                data.forEach(row => {
                    // Try to find test by Code first, then Name
                    const rowNormalized = {};
                    Object.keys(row).forEach(k => rowNormalized[k.toLowerCase().trim()] = row[k]);

                    const code = rowNormalized['test code'] || rowNormalized['code'];
                    const priceRaw = rowNormalized['custom price'] || rowNormalized['price'] || rowNormalized['rate'];
                    const price = parseInt(priceRaw);

                    if (!isNaN(price)) {
                        let test = tests.find(t => t.code === code);
                        if (!test && rowNormalized['test name']) {
                            test = tests.find(t => t.name.toLowerCase() === rowNormalized['test name'].toLowerCase());
                        }

                        if (test) {
                            newPrices[test.code] = price;
                            matchCount++;
                        }
                    }
                });

                setCustomPrices(newPrices);
                setMessage({ type: 'success', text: `Imported ${matchCount} prices successfully!` });
            } catch (error) {
                console.error("Import error", error);
                setMessage({ type: 'error', text: 'Failed to parse file. Ensure it is a valid Excel file.' });
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setMessage(null);
        try {
            // Clean up undefined values
            const pricesToSave = Object.entries(customPrices).reduce((acc, [key, val]) => {
                if (val !== undefined && val !== null && !isNaN(val)) acc[key] = val;
                return acc;
            }, {});

            await storage.saveReferralPrices(referral.id, pricesToSave);

            // Audit Log
            const count = Object.keys(pricesToSave).length;
            if (count > 0) {
                await logAdmin.referralPricingUpdated(referral.name, `Updated custom prices for ${count} tests`);
            }

            setMessage({ type: 'success', text: 'Prices updated successfully!' });
            setTimeout(() => onClose(), 1500);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save prices.' });
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTests = tests.filter(test =>
        test.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) return <div className="p-8 text-center">Loading prices...</div>;

    return (
        <div className="flex flex-col h-[80vh] bg-white rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Manage Prices: {referral.name}</h2>
                    <p className="text-sm text-slate-500">Set custom prices for this referral source.</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="h-6 w-6 text-slate-500" />
                </button>
            </div>

            {/* Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full md:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search tests..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors border border-emerald-100"
                        title="Download matching template"
                    >
                        <Download className="h-4 w-4 mr-2" /> Template
                    </button>
                    <label className="flex items-center px-3 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer border border-blue-100">
                        <Upload className="h-4 w-4 mr-2" /> Upload Excel
                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                    </label>

                    <div className="w-px h-6 bg-slate-200 mx-1 hidden md:block"></div>

                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase px-1">Discount:</span>
                        <input
                            type="number"
                            placeholder="%"
                            className="w-12 px-1 py-1 rounded border border-slate-300 text-sm text-center"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(e.target.value)}
                        />
                        <button onClick={applyGlobalDiscount} className="text-xs bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-bold hover:bg-indigo-200">
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto p-4">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase rounded-l-lg">Test Name</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right">MRP (Base)</th>
                            <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase text-right rounded-r-lg">Custom Price</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredTests.map(test => {
                            const customPrice = customPrices[test.code];
                            const isModified = customPrice !== undefined && customPrice !== test.price;

                            return (
                                <tr key={test.code} className={`hover:bg-slate-50 ${isModified ? 'bg-indigo-50/30' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-800">{test.name}</div>
                                        <div className="text-xs text-slate-400 font-mono">{test.code}</div>
                                    </td>
                                    <td className="px-4 py-3 text-right text-slate-500">
                                        ₹{test.price}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {isModified && (
                                                <button
                                                    onClick={() => handlePriceChange(test.code, '')}
                                                    title="Reset to MRP"
                                                >
                                                    <RotateCcw className="h-4 w-4 text-slate-400 hover:text-indigo-500" />
                                                </button>
                                            )}
                                            <input
                                                type="number"
                                                className={`w-24 px-3 py-1.5 rounded-lg border text-right font-bold focus:outline-none focus:ring-2 ${isModified ? 'border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-700' : 'border-slate-200 text-slate-700'}`}
                                                value={customPrice !== undefined ? customPrice : ''}
                                                placeholder={test.price}
                                                onChange={(e) => handlePriceChange(test.code, e.target.value)}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex-1">
                    {message && (
                        <div className={`flex items-center text-sm ${message.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {message.type === 'success' ? <CheckCircle className="h-4 w-4 mr-2" /> : <AlertCircle className="h-4 w-4 mr-2" />}
                            {message.text}
                        </div>
                    )}
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {isSaving ? 'Saving...' : 'Save Prices'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReferralPriceManager;

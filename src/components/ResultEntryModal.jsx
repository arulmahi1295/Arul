import React, { useState } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const ResultEntryModal = ({ order, onClose, onSave }) => {
    // Initialize results state with existing order results or empty fields for each test
    const [results, setResults] = useState(() => {
        if (order.results && order.results.length > 0) {
            return order.results;
        }
        return order.tests.map(test => ({
            testId: test.id,
            name: test.name,
            result: '',
            unit: test.defaultUnit || '',
            refRange: test.defaultRefRange || '',
            method: test.defaultMethod || ''
        }));
    });

    const handleResultChange = (index, field, value) => {
        const newResults = [...results];
        newResults[index] = { ...newResults[index], [field]: value };
        setResults(newResults);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(order.id, results);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <header className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Enter Results</h2>
                        <p className="text-slate-500 text-sm mt-1">Order #{order.id} • {order.patientId}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {order.tests.map((test, index) => (
                            <div key={test.id} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <h3 className="font-semibold text-slate-800 mb-3 flex items-center">
                                    <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs mr-2">{test.code}</span>
                                    {test.name}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-1">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Result Value</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm font-bold"
                                            value={results[index].result}
                                            onChange={(e) => handleResultChange(index, 'result', e.target.value)}
                                            placeholder="Value"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Units</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                                            value={results[index].unit}
                                            onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                                            placeholder="e.g. mg/dL"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Ref. Range</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                                            value={results[index].refRange}
                                            onChange={(e) => handleResultChange(index, 'refRange', e.target.value)}
                                            placeholder="Min - Max"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Method</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm"
                                            value={results[index].method}
                                            onChange={(e) => handleResultChange(index, 'method', e.target.value)}
                                            placeholder="e.g. ELISA"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </form>

                <footer className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                    <button type="button" onClick={onClose} className="px-5 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} className="px-5 py-2.5 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded-xl shadow-lg shadow-indigo-200 flex items-center transition-all">
                        <Save className="h-4 w-4 mr-2" />
                        Save & Complete Report
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default ResultEntryModal;

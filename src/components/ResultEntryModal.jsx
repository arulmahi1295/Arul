import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, FileCheck } from 'lucide-react';

const ResultEntryModal = ({ order, onClose, onSave }) => {
    const [results, setResults] = useState([]);
    const [isFinalized, setIsFinalized] = useState(false);

    useEffect(() => {
        // Initialize results from order or existing results
        if (order.results && order.results.length > 0) {
            setResults(order.results);
        } else {
            // Map from order.tests
            setResults(order.tests.map(t => ({
                ...t,
                result: t.result || '',
                remark: t.remark || ''
            })));
        }

        // If already completed, set finalized to true
        if (order.status === 'completed') {
            setIsFinalized(true);
        }
    }, [order]);

    const handleResultChange = (index, value) => {
        const newResults = [...results];
        newResults[index].result = value;
        setResults(newResults);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(order.id, results, isFinalized);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Enter Test Results</h2>
                        <p className="text-sm text-slate-500">Patient: {order.patientName} ({order.patientId})</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <form id="result-form" onSubmit={handleSubmit} className="space-y-6">
                        {results.map((test, index) => (
                            <div key={index} className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-4">
                                    <p className="font-semibold text-sm text-slate-800">{test.name}</p>
                                    <p className="text-xs text-slate-400">{test.method || 'Standard Method'}</p>
                                </div>
                                <div className="col-span-3">
                                    <input
                                        type="text"
                                        placeholder="Result"
                                        className="w-full p-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 outline-none"
                                        value={test.result}
                                        onChange={(e) => handleResultChange(index, e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-span-2 text-xs text-slate-500">
                                    {test.unit}
                                </div>
                                <div className="col-span-3 text-xs text-slate-500 text-right bg-slate-50 p-1 rounded">
                                    Ref: {test.refRange || 'N/A'}
                                </div>
                            </div>
                        ))}

                        <div className="pt-6 border-t border-slate-100">
                            <label className="flex items-center space-x-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${isFinalized ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-emerald-400'}`}>
                                    {isFinalized && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isFinalized}
                                    onChange={(e) => setIsFinalized(e.target.checked)}
                                />
                                <div>
                                    <p className="font-bold text-sm text-slate-800">Finalize & Sign Report</p>
                                    <p className="text-xs text-slate-500">Attach digital signature and mark as ready for delivery.</p>
                                </div>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="result-form"
                        className={`px-6 py-2 rounded-lg text-sm font-bold text-white flex items-center shadow-lg transform active:scale-95 transition-all ${isFinalized ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                    >
                        {isFinalized ? (
                            <>
                                <FileCheck className="h-4 w-4 mr-2" />
                                Save & Finalize
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Draft
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResultEntryModal;

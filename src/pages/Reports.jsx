import React, { useState } from 'react';
import { FileText, Download, Send, Eye, Search, AlertTriangle } from 'lucide-react';

const MOCK_REPORTS = [
    { id: 'RPT-2024-001', patient: 'Michael Brown', test: 'HbA1c', status: 'ready', date: '2024-12-27', normal: true },
    { id: 'RPT-2024-002', patient: 'Sarah Smith', test: 'Thyroid Profile', status: 'draft', date: '2024-12-27', normal: true },
    { id: 'RPT-2024-003', patient: 'John Doe', test: 'Lipid Profile', status: 'ready', date: '2024-12-26', normal: false }, // Abnormal
];

const Reports = () => {
    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Diagnostic Reports</h1>
                    <p className="text-slate-500">View, generate, and distribute patient results.</p>
                </div>
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                    New Result Entry
                </button>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div className="relative w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Patient Name or Report ID..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-white border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:border-indigo-500">
                            <option>All Reports</option>
                            <option>Ready</option>
                            <option>Drafts</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                <div className="divide-y divide-slate-100">
                    {MOCK_REPORTS.map(report => (
                        <div key={report.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-4">
                                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${report.normal ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-slate-800">{report.patient}</h3>
                                    <p className="text-xs text-slate-500 flex items-center">
                                        {report.id} • {report.test}
                                        {!report.normal && (
                                            <span className="ml-2 flex items-center text-rose-600 font-bold text-[10px] bg-rose-50 px-1.5 py-0.5 rounded">
                                                <AlertTriangle className="h-3 w-3 mr-1" /> ABNORMAL
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1 ${report.status === 'ready' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                        {report.status}
                                    </span>
                                    <p className="text-xs text-slate-400">{report.date}</p>
                                </div>

                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View">
                                        <Eye className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Download">
                                        <Download className="h-4 w-4" />
                                    </button>
                                    <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Email">
                                        <Send className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Reports;

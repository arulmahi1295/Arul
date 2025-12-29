import React, { useState } from 'react';
import { Filter, Search, MoreHorizontal, Clock, CheckCircle, AlertCircle, Beaker } from 'lucide-react';

const MOCK_SAMPLES = [
    { id: 'SPL-001', patient: 'John Doe', test: 'CBC, Lipid Profile', status: 'collected', time: '10:30 AM', urgency: 'routine' },
    { id: 'SPL-002', patient: 'Sarah Smith', test: 'Thyroid Profile', status: 'processing', time: '09:15 AM', urgency: 'routine' },
    { id: 'SPL-003', patient: 'Michael Brown', test: 'HbA1c', status: 'completed', time: 'Yesterday', urgency: 'routine' },
    { id: 'SPL-004', patient: 'Emily Davis', test: 'Urgent: Malaria Smear', status: 'pending', time: '11:00 AM', urgency: 'urgent' },
    { id: 'SPL-005', patient: 'Robert Wilson', test: 'Vitamin D', status: 'collected', time: '10:45 AM', urgency: 'routine' },
];

const StatusBadge = ({ status }) => {
    const styles = {
        pending: 'bg-slate-100 text-slate-600',
        collected: 'bg-blue-50 text-blue-700',
        processing: 'bg-orange-50 text-orange-700',
        completed: 'bg-emerald-50 text-emerald-700',
        rejected: 'bg-rose-50 text-rose-700',
    };

    const labels = {
        pending: 'Pending Collection',
        collected: 'Sample Collected',
        processing: 'In Processing',
        completed: 'Results Ready',
        rejected: 'Rejected',
    };

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.pending} border border-transparent`}>
            {labels[status]}
        </span>
    );
};

const Samples = () => {
    const [filter, setFilter] = useState('all');

    const filteredSamples = filter === 'all'
        ? MOCK_SAMPLES
        : MOCK_SAMPLES.filter(s => s.status === filter);

    return (
        <div>
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Sample Tracking</h1>
                    <p className="text-slate-500">Monitor sample status from collection to reporting.</p>
                </div>
                <button className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 text-sm font-medium hover:bg-slate-50">
                    <Filter className="mr-2 h-4 w-4" /> Filter View
                </button>
            </header>

            {/* Kanban-ish Status Overview */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                {['pending', 'collected', 'processing', 'completed'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(filter === status ? 'all' : status)}
                        className={`p-4 rounded-xl border text-left transition-all ${filter === status ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                    >
                        <span className="block text-xs uppercase font-bold text-slate-400 mb-1">{status}</span>
                        <span className="text-2xl font-bold text-slate-800">{MOCK_SAMPLES.filter(s => s.status === status).length}</span>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by Barcode, Patient Name..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 text-sm"
                        />
                    </div>
                </div>

                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs uppercase font-semibold">
                        <tr>
                            <th className="px-6 py-4">Sample ID</th>
                            <th className="px-6 py-4">Patient</th>
                            <th className="px-6 py-4">Test(s)</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Time</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredSamples.map(sample => (
                            <tr key={sample.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 font-mono text-sm text-slate-600 font-medium">
                                    <div className="flex items-center">
                                        <Beaker className="h-4 w-4 mr-2 text-slate-400" />
                                        {sample.id}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="block text-sm font-medium text-slate-800">{sample.patient}</span>
                                    {sample.urgency === 'urgent' && <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded ml-2">URGENT</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-600">{sample.test}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={sample.status} />
                                </td>
                                <td className="px-6 py-4 text-sm text-slate-500 flex items-center">
                                    <Clock className="h-3 w-3 mr-1.5" />
                                    {sample.time}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-slate-400 hover:text-indigo-600 p-1">
                                        <MoreHorizontal className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Samples;

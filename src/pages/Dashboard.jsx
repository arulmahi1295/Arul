import React from 'react';
import { Users, Beaker, FileText, Activity } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            {trend && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                    {trend > 0 ? '+' : ''}{trend}%
                </span>
            )}
        </div>
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </div>
);

const Dashboard = () => {
    return (
        <div>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back, Jane. Here's what's happening today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Patients" value="1,248" icon={Users} color="bg-blue-500" trend={12} />
                <StatCard title="Samples Collected" value="84" icon={Beaker} color="bg-purple-500" trend={8} />
                <StatCard title="Pending Reports" value="12" icon={FileText} color="bg-orange-500" trend={-2} />
                <StatCard title="Revenue (Today)" value="$4,320" icon={Activity} color="bg-emerald-500" trend={15} />
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
                <div className="flex items-center justify-center h-48 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Chart Placeholder
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect } from 'react';
import { Users, Beaker, FileText, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { storage } from '../data/storage';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
    <div className="glass-panel p-6 rounded-2xl hover:border-brand-300 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
            <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center shadow-md`}>
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
    const [stats, setStats] = useState({
        totalPatients: 0,
        samplesCollected: 0,
        pendingReports: 0,
        revenue: 0
    });

    const [user, setUser] = useState({ name: 'User' });

    useEffect(() => {
        const auth = JSON.parse(localStorage.getItem('lis_auth') || '{}');
        if (auth.user) setUser({ name: auth.user });

        // Determine stats from storage
        const patients = storage.getPatients();
        const orders = storage.getOrders();

        // Revenue calc
        const revenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const pending = orders.filter(o => o.status === 'pending').length;

        setStats({
            totalPatients: patients.length,
            samplesCollected: orders.length, // approximation for now
            pendingReports: pending,
            revenue: revenue
        });
    }, []);

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back, {user.name}. Here's what's happening today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="bg-brand-500" trend={12} />
                <StatCard title="Total Orders" value={stats.samplesCollected} icon={Beaker} color="bg-indigo-500" trend={8} />
                <StatCard title="Pending" value={stats.pendingReports} icon={FileText} color="bg-orange-500" trend={-2} />
                <StatCard title="Revenue" value={`₹${stats.revenue}`} icon={Activity} color="bg-emerald-500" trend={15} />
            </div>

            <div className="glass-panel rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Orders Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                        data={[{ name: 'Jan', orders: 4000 }, { name: 'Feb', orders: 3000 }, { name: 'Mar', orders: 2000 }, { name: 'Apr', orders: 2780 }, { name: 'May', orders: 1890 }, { name: 'Jun', orders: 2390 }, { name: 'Jul', orders: 3490 }]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: '#0e7490' }}
                        />
                        <Area type="monotone" dataKey="orders" stroke="#06b6d4" fillOpacity={1} fill="url(#colorOrders)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default Dashboard;

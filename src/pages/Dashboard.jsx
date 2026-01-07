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
    const [chartPeriod, setChartPeriod] = useState('week'); // 'day', 'week', 'month', 'quarter', 'year'
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        const loadDashboardData = async () => {
            const auth = JSON.parse(localStorage.getItem('lis_auth') || '{}');
            if (auth.user) setUser({ name: auth.user });

            const allPatients = (await storage.getPatients()) || [];
            const allOrders = (await storage.getOrders()) || [];

            // Filter based on selected period
            const now = new Date();
            let startDate = new Date(0); // Default fallback

            if (chartPeriod === 'day') {
                startDate = new Date(now.setHours(0, 0, 0, 0));
            } else if (chartPeriod === 'week') {
                // Last 7 days
                const d = new Date();
                d.setDate(d.getDate() - 6);
                d.setHours(0, 0, 0, 0);
                startDate = d;
            } else if (chartPeriod === 'month') {
                // Start of current month
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (chartPeriod === 'quarter') {
                // Start of 3 months ago (Current + 2 prev)
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            }

            const filterByDate = (item) => new Date(item.createdAt) >= startDate;

            const filteredPatients = allPatients.filter(filterByDate);
            const filteredOrders = allOrders.filter(filterByDate);

            const revenue = filteredOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
            const pending = filteredOrders.filter(o => o.status === 'pending').length;

            setStats({
                totalPatients: filteredPatients.length,
                samplesCollected: filteredOrders.length,
                pendingReports: pending,
                revenue: revenue
            });

            // Generate Chart Data based on Orders
            processChartData(allOrders, chartPeriod);
        };

        loadDashboardData();

    }, [chartPeriod]); // Re-run when period changes

    const processChartData = (orders, period) => {
        const now = new Date();
        let data = [];

        if (period === 'day') {
            // Hourly for Today
            const todayStr = now.toISOString().split('T')[0];
            const todayOrders = orders.filter(o => o.createdAt.startsWith(todayStr));
            // Initialize 24 hours
            const hours = Array.from({ length: 24 }, (_, i) => ({
                name: `${i}:00`,
                orders: 0,
                revenue: 0
            }));

            todayOrders.forEach(o => {
                const hour = new Date(o.createdAt).getHours();
                hours[hour].orders += 1;
                hours[hour].revenue += (o.totalAmount || 0);
            });
            // Filter to show only up to current hour or all? Let's show representative hours (e.g. 8-20) or all
            data = hours.filter((_, i) => i >= 6 && i <= 22); // Show 6 AM to 10 PM
        }
        else if (period === 'week') {
            // Last 7 Days
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(now.getDate() - i);
                const dStr = d.toISOString().split('T')[0];
                const label = d.toLocaleDateString('en-US', { weekday: 'short' });

                const dayOrders = orders.filter(o => o.createdAt.startsWith(dStr));
                const rev = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

                data.push({ name: label, orders: dayOrders.length, revenue: rev });
            }
        }
        else if (period === 'month') {
            // Days of Current Month
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const dStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                // Only add if date is past or today? Or prepare full month structure.
                if (new Date(dStr) > now) break;

                const dayOrders = orders.filter(o => o.createdAt.startsWith(dStr));
                const rev = dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
                data.push({ name: i, orders: dayOrders.length, revenue: rev });
            }
        }
        else if (period === 'quarter') {
            // Last 3 Months
            for (let i = 2; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const mStr = String(d.getMonth() + 1).padStart(2, '0');
                const yStr = d.getFullYear();
                const label = d.toLocaleDateString('en-US', { month: 'short' });

                // Filter orders for this yyyy-mm
                const monthOrders = orders.filter(o => o.createdAt.startsWith(`${yStr}-${mStr}`));
                const rev = monthOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);

                data.push({ name: label, orders: monthOrders.length, revenue: rev });
            }
        }

        setChartData(data);
    };

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
                <p className="text-slate-500">Welcome back, {user.name}. Here's what's happening today.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="bg-brand-500" trend={12} />
                <StatCard title="Total Orders" value={stats.samplesCollected} icon={Beaker} iconColor="text-indigo-600" color="bg-indigo-100" trend={8} />
                <StatCard title="Pending" value={stats.pendingReports} icon={FileText} iconColor="text-orange-600" color="bg-orange-100" trend={-2} />
                <StatCard title="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={Activity} iconColor="text-emerald-600" color="bg-emerald-100" trend={15} />
            </div>

            <div className="glass-panel rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-800">Revenue & Sales Overview</h2>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {['day', 'week', 'month', 'quarter'].map(p => (
                            <button
                                key={p}
                                onClick={() => setChartPeriod(p)}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${chartPeriod === p
                                    ? 'bg-white text-indigo-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={chartData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} dy={10} />
                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                            <Area yAxisId="right" type="monotone" dataKey="orders" name="Orders" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

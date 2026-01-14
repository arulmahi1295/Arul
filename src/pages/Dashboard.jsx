import React, { useState, useEffect } from 'react';
import { Users, Beaker, FileText, Activity, TrendingUp, Clock, Calendar, ArrowRight, Star, Database, RefreshCw, Trash2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { storage } from '../data/storage';
import { seedDashboardData, clearSeedData } from '../utils/seedData';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(6,81,237,0.1)] transition-all duration-300 group cursor-default">
        <div className="flex items-start justify-between mb-4">
            <div className={`h-12 w-12 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
            {trend && (
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    <TrendingUp className={`h-3 w-3 mr-1 ${trend === 'down' ? 'rotate-180' : ''}`} />
                    {trendValue}
                </span>
            )}
        </div>
        <div>
            <p className="text-slate-500 text-sm font-semibold tracking-wide uppercase">{title}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1">{value}</h3>
            {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
    </div>
);

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalPatients: 0,
        samplesCollected: 0,
        pendingReports: 0,
        revenue: 0,
        todayPatients: 0
    });
    const [user, setUser] = useState({ name: 'User' });
    const [chartPeriod, setChartPeriod] = useState('week');
    const [chartData, setChartData] = useState([]);
    const [demographicsData, setDemographicsData] = useState([]);
    const [statusData, setStatusData] = useState([]);
    const [popularTests, setPopularTests] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);
    const [insights, setInsights] = useState(null);
    const [isSeeding, setIsSeeding] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, [chartPeriod]);

    const loadDashboardData = async () => {
        const auth = JSON.parse(localStorage.getItem('lis_auth') || '{}');
        if (auth.user) setUser({ name: auth.user });

        const allPatients = (await storage.getPatients()) || [];
        const allOrders = (await storage.getOrders()) || [];

        // --- Helper for Date Comparison ---
        const isSameDay = (d1, d2) => {
            return d1.getDate() === d2.getDate() &&
                d1.getMonth() === d2.getMonth() &&
                d1.getFullYear() === d2.getFullYear();
        };

        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // --- Stats Calculation ---
        const todayOrders = allOrders.filter(o => isSameDay(new Date(o.createdAt), today));
        const pending = allOrders.filter(o => o.status === 'pending').length;
        const totalRev = allOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const todayRev = todayOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const growth = ((todayOrders.length - 5) / 5) * 100; // Mock growth logic

        setStats({
            totalPatients: allPatients.length,
            samplesCollected: allOrders.length,
            pendingReports: pending,
            revenue: totalRev,
            todayPatients: todayOrders.length
        });

        // --- Business Insights ---
        const yesterdayOrders = allOrders.filter(o => isSameDay(new Date(o.createdAt), yesterday));
        const yesterdayRev = yesterdayOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        // Growth msg
        let growthMsg = "Steady flow today!";
        if (todayRev > yesterdayRev) {
            const diff = yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : 100;
            growthMsg = `🚀 Revenue up ${diff}% from yesterday!`;
        } else if (todayOrders.length > 0) {
            growthMsg = "🌟 Good activity today!";
        }

        // Top Referrer
        const currentMonth = new Date().getMonth();
        const refCounts = {};
        allOrders.filter(o => new Date(o.createdAt).getMonth() === currentMonth).forEach(o => {
            const name = o.referral?.name || (typeof o.referral === 'string' ? o.referral : null);
            if (name && name !== 'Self') refCounts[name] = (refCounts[name] || 0) + 1;
        });
        const bestRef = Object.entries(refCounts).sort((a, b) => b[1] - a[1])[0];

        // Top Test
        const insightTestStats = {};
        allOrders.forEach(o => {
            if (o.tests) o.tests.forEach(t => insightTestStats[t.name] = (insightTestStats[t.name] || 0) + 1);
        });
        const bestTest = Object.entries(insightTestStats).sort((a, b) => b[1] - a[1])[0];

        setInsights({
            growthMsg,
            topReferrer: bestRef ? { name: bestRef[0], count: bestRef[1] } : null,
            topTest: bestTest ? { name: bestTest[0], count: bestTest[1] } : null
        });

        // --- Chart Data (Revenue) ---
        processChartData(allOrders, chartPeriod);

        // --- Demographics ---
        const genderCounts = { Male: 0, Female: 0, Other: 0 };
        allPatients.forEach(p => {
            const g = p.gender ? p.gender.charAt(0).toUpperCase() + p.gender.slice(1) : 'Other';
            if (genderCounts[g] !== undefined) genderCounts[g]++;
            else genderCounts.Other++;
        });
        setDemographicsData([
            { name: 'Male', value: genderCounts.Male, color: '#6366f1' },   // Indigo
            { name: 'Female', value: genderCounts.Female, color: '#ec4899' }, // Pink
            { name: 'Other', value: genderCounts.Other, color: '#94a3b8' }    // Slate
        ].filter(d => d.value > 0));

        // --- Order Status ---
        const statusCounts = { pending: 0, completed: 0, processing: 0, cancelled: 0 };
        allOrders.forEach(o => {
            const s = o.status ? o.status.toLowerCase() : 'pending';
            if (statusCounts[s] !== undefined) statusCounts[s]++;
        });
        setStatusData([
            { name: 'Completed', value: statusCounts.completed, color: '#10b981' }, // Emerald
            { name: 'Pending', value: statusCounts.pending, color: '#f59e0b' },     // Amber
            { name: 'Processing', value: statusCounts.processing, color: '#6366f1' }, // Indigo
        ].filter(d => d.value > 0));

        // --- Popular Tests ---
        const testCounts = {};
        allOrders.forEach(o => {
            if (o.tests) {
                o.tests.forEach(t => {
                    testCounts[t.name] = (testCounts[t.name] || 0) + 1;
                });
            }
        });
        setPopularTests(
            Object.entries(testCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([name, count]) => ({ name: name.length > 15 ? name.substring(0, 15) + '...' : name, count }))
        );

        // --- Recent Activity ---
        const combinedActivity = [
            ...allOrders.map(o => ({
                type: 'order',
                id: o.id,
                title: 'New Order',
                desc: `${o.patientName || o.patientId} - ₹${o.totalAmount}`,
                time: new Date(o.createdAt),
                status: o.status
            })),
            ...allPatients.map(p => ({
                type: 'patient',
                id: p.id,
                title: 'New Patient',
                desc: p.fullName,
                time: new Date(p.createdAt),
                status: 'active'
            }))
        ].sort((a, b) => b.time - a.time).slice(0, 6);
        setRecentActivity(combinedActivity);
    };

    const processChartData = (orders, period) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let data = [];

        if (period === 'week') {
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dayOrders = orders.filter(o => {
                    const od = new Date(o.createdAt);
                    return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
                });
                data.push({
                    name: d.toLocaleDateString('en-US', { weekday: 'short' }),
                    revenue: dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
                    orders: dayOrders.length
                });
            }
        } else if (period === 'month') {
            for (let i = 29; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dayOrders = orders.filter(o => {
                    const od = new Date(o.createdAt);
                    return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
                });
                data.push({
                    name: d.getDate(),
                    revenue: dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
                    orders: dayOrders.length
                });
            }
        }
        setChartData(data);
    };

    const handleSeedData = async () => {
        if (!confirm('Generate random data? This will add patients and orders to your database.')) return;
        setIsSeeding(true);
        await seedDashboardData();
        await loadDashboardData();
        setIsSeeding(false);
    };

    const handleClearData = async () => {
        if (!confirm('Clear all demo data? This will remove generated orders and patients.')) return;
        setIsSeeding(true);
        await clearSeedData();
        await loadDashboardData();
        setIsSeeding(false);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden flex justify-between items-end">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 pointer-events-none"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2 tracking-wide uppercase">
                        <Star className="h-4 w-4" />
                        <span>Daily Overview</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">
                        {getGreeting()}, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{user.name}</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        Here's what's happening in your lab today.
                    </p>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={handleSeedData}
                        disabled={isSeeding}
                        className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSeeding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                        {isSeeding ? 'Generatng...' : 'Seed Data'}
                    </button>
                    {isSeeding && <p className="text-xs text-indigo-400 mt-2 text-center">Working magic...</p>}
                </div>
                <div className="relative z-10 ml-2">
                    <button
                        onClick={handleClearData}
                        disabled={isSeeding}
                        className="flex items-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 className="h-4 w-4" />
                        Clear Demo
                    </button>
                </div>
            </header>

            {/* Insights Banner */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-indigo-100 font-medium text-sm uppercase tracking-wider">
                                <TrendingUp className="h-4 w-4" /> Daily Pulse
                            </div>
                            <p className="text-lg font-bold leading-tight">{insights.growthMsg}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                <Star className="h-4 w-4" /> Top Referrer
                            </div>
                            {insights.topReferrer ? (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{insights.topReferrer.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Driving growth with <span className="font-bold text-emerald-600">{insights.topReferrer.count} referrals</span></p>
                                </div>
                            ) : <p className="text-slate-400 text-sm">No referrals yet.</p>}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-amber-600 font-bold text-xs uppercase tracking-wider">
                                <Activity className="h-4 w-4" /> Best Seller
                            </div>
                            {insights.topTest ? (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800 truncate" title={insights.topTest.name}>{insights.topTest.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Performed <span className="font-bold text-amber-600">{insights.topTest.count} times</span></p>
                                </div>
                            ) : <p className="text-slate-400 text-sm">No data yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Patients" value={stats.totalPatients} icon={Users} color="bg-blue-500" subtitle="Lifetime registrations" />
                <StatCard title="Samples Today" value={stats.samplesCollected} icon={Beaker} color="bg-indigo-500" trend="up" trendValue="Active" />
                <StatCard title="Pending Reports" value={stats.pendingReports} icon={Clock} color="bg-amber-500" subtitle="Requiring attention" />
                <StatCard title="Revenue" value={`₹${stats.revenue.toLocaleString()}`} icon={Activity} color="bg-emerald-500" trend="up" trendValue={chartPeriod === 'week' ? 'This Week' : 'This Month'} />
            </div>

            {/* Charts Row 1: Revenue (Big) */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Revenue Analytics</h3>
                        <p className="text-sm text-slate-400">Financial performance over time</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        <button
                            onClick={() => setChartPeriod('week')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${chartPeriod === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setChartPeriod('month')}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${chartPeriod === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Month
                        </button>
                    </div>
                </div>
                <div className="h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(val) => `₹${val / 1000}k`} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '4 4' }}
                            />
                            <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2: Distributions & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Order Status */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Order Status</h3>
                    <p className="text-sm text-slate-400 mb-4">Current workload distribution</p>
                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-700">{stats.samplesCollected}</span>
                            <span className="block text-[10px] text-slate-400 uppercase tracking-wide">Orders</span>
                        </div>
                    </div>
                </div>

                {/* Demographics */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Demographics</h3>
                    <p className="text-sm text-slate-400 mb-4">Patient gender ratio</p>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={demographicsData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}>
                                    {demographicsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#fff" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Popular Tests */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Top Tests</h3>
                    <p className="text-sm text-slate-400 mb-4">Most frequent analyses</p>
                    <div className="flex-1 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={popularTests} layout="vertical" margin={{ left: 0, right: 10 }}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f1f5f9' }} />
                                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Row: Recent Activity (Full Width) */}
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Live Activity Feed</h3>
                    <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center transition-colors">
                        View All <ArrowRight className="h-4 w-4 ml-1" />
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentActivity.length === 0 ? (
                        <p className="text-slate-400 col-span-full text-center py-8">No recent activity.</p>
                    ) : (
                        recentActivity.map((item, idx) => (
                            <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-md transition-all duration-300">
                                <div className={`h-10 w-10 rounded-full flex-shrink-0 flex items-center justify-center ${item.type === 'order' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {item.type === 'order' ? <FileText className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.desc}</p>
                                    <span className="text-[10px] text-slate-400 font-medium mt-2 block">
                                        {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {item.time.toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

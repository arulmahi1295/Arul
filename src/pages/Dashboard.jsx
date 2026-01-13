import React, { useState, useEffect } from 'react';
import { Users, Beaker, FileText, Activity, TrendingUp, Clock, Calendar, ArrowRight, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { storage } from '../data/storage';

const StatCard = ({ title, value, icon: Icon, color, trend, trendValue, subtitle }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_10px_-4px_rgba(6,81,237,0.1)] hover:shadow-lg transition-all duration-300 group">
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
    const [popularTests, setPopularTests] = useState([]);
    const [recentActivity, setRecentActivity] = useState([]);

    const [insights, setInsights] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, [chartPeriod]);

    const loadDashboardData = async () => {
        const auth = JSON.parse(localStorage.getItem('lis_auth') || '{}');
        if (auth.user) setUser({ name: auth.user });

        const allPatients = (await storage.getPatients()) || [];
        const allOrders = (await storage.getOrders()) || [];

        // --- Stats Calculation ---
        const todayStr = new Date().toISOString().split('T')[0];
        const todayOrders = allOrders.filter(o => o.createdAt.startsWith(todayStr));
        const pending = allOrders.filter(o => o.status === 'pending').length;
        const totalRev = allOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
        const todayRev = todayOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        setStats({
            totalPatients: allPatients.length,
            samplesCollected: allOrders.length,
            pendingReports: pending,
            revenue: totalRev,
            todayPatients: todayOrders.length
        });

        // --- Business Insights (Excitement Logic) ---
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = yesterday.toISOString().split('T')[0];
        const yesterdayOrders = allOrders.filter(o => o.createdAt.startsWith(yStr));
        const yesterdayRev = yesterdayOrders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);

        // Growth
        let growthMsg = "Steady flow today!";
        let growthTrend = 'neutral';
        if (todayRev > yesterdayRev) {
            const diff = yesterdayRev > 0 ? Math.round(((todayRev - yesterdayRev) / yesterdayRev) * 100) : 100;
            growthMsg = `🚀 Amazing! Revenue is up ${diff}% from yesterday!`;
            growthTrend = 'up';
        } else if (todayPatients > 0) {
            growthMsg = "🌟 Keep it up! Every patient counts.";
            growthTrend = 'neutral';
        }

        // Top Referrer (This Month)
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
            growthTrend,
            topReferrer: bestRef ? { name: bestRef[0], count: bestRef[1] } : null,
            topTest: bestTest ? { name: bestTest[0], count: bestTest[1] } : null
        });

        // --- Chart Data (Revenue) ---
        processChartData(allOrders, chartPeriod);

        // --- Demographics Data ---
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

        // --- Popular Tests ---
        const testCounts = {};
        allOrders.forEach(o => {
            if (o.tests) {
                o.tests.forEach(t => {
                    testCounts[t.name] = (testCounts[t.name] || 0) + 1;
                });
            }
        });
        const sortedTests = Object.entries(testCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, count]) => ({ name: name.length > 20 ? name.substring(0, 20) + '...' : name, count }));
        setPopularTests(sortedTests);

        // --- Recent Activity ---
        const combinedActivity = [
            ...allOrders.map(o => ({
                type: 'order',
                id: o.id,
                title: 'New Order Created',
                desc: `${o.patientName || o.patientId} - ${o.tests.length} Lists`,
                time: new Date(o.createdAt),
                status: o.status
            })),
            ...allPatients.map(p => ({
                type: 'patient',
                id: p.id,
                title: 'New Patient Registered',
                desc: p.fullName,
                time: new Date(p.createdAt),
                status: 'active'
            }))
        ].sort((a, b) => b.time - a.time).slice(0, 5);
        setRecentActivity(combinedActivity);
    };

    const processChartData = (orders, period) => {
        const now = new Date();
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
            // Last 30 days
            for (let i = 29; i >= 0; i--) { // Show every 2nd day to avoid crowding or just aggregation
                // Actually, let's just do all days but format XAxis to show fewer ticks if needed, 
                // or maybe just do weeks? 
                // User likely expects "Monthly View" meaning "This Month" broken down by day, or "Last 30 Days"
                // Let's do "Last 30 Days" but aggregated? No, usually "Month" view in these dashboards means day-by-day for the current month.
                // Let's do Day-by-day for the last 30 days.
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dayOrders = orders.filter(o => {
                    const od = new Date(o.createdAt);
                    return od.getDate() === d.getDate() && od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
                });
                data.push({
                    name: d.getDate(), // Just the date number
                    fullDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    revenue: dayOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
                    orders: dayOrders.length
                });
            }
        } else if (period === 'year') {
            // Last 12 months
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today);
                d.setMonth(d.getMonth() - i);
                const monthOrders = orders.filter(o => {
                    const od = new Date(o.createdAt);
                    return od.getMonth() === d.getMonth() && od.getFullYear() === d.getFullYear();
                });
                data.push({
                    name: d.toLocaleDateString('en-US', { month: 'short' }),
                    revenue: monthOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0),
                    orders: monthOrders.length
                });
            }
        }

        setChartData(data);
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="max-w-7xl mx-auto pb-12 space-y-8">
            {/* Morning Brief Header */}
            <header className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2 tracking-wide uppercase">
                        <Star className="h-4 w-4" />
                        <span>Daily Overview</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-800 mb-2">
                        {getGreeting()}, <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{user.name}</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-2xl">
                        You have <strong className="text-slate-800">{stats.todayPatients} new patients</strong> today and <strong className="text-slate-800">{stats.pendingReports} pending reports</strong> requiring attention.
                    </p>
                </div>
            </header>

            {/* Business Insights Banner */}
            {insights && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-700">
                    {/* Growth Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:scale-110 transition-transform"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-indigo-100 font-medium text-sm uppercase tracking-wider">
                                <TrendingUp className="h-4 w-4" /> Daily Pulse
                            </div>
                            <p className="text-lg font-bold leading-tight">{insights.growthMsg}</p>
                        </div>
                    </div>

                    {/* Top Referrer */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-full blur-xl -mr-5 -mt-5"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-emerald-600 font-bold text-xs uppercase tracking-wider">
                                <Star className="h-4 w-4" /> Star Partner
                            </div>
                            {insights.topReferrer ? (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{insights.topReferrer.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Driving growth with <span className="font-bold text-emerald-600">{insights.topReferrer.count} referrals</span> this month!</p>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">No referrals yet this month.</p>
                            )}
                        </div>
                    </div>

                    {/* Top Test */}
                    <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-orange-50 rounded-full blur-xl -mr-5 -mt-5"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3 text-amber-600 font-bold text-xs uppercase tracking-wider">
                                <Activity className="h-4 w-4" /> Best Seller
                            </div>
                            {insights.topTest ? (
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">{insights.topTest.name.length > 25 ? insights.topTest.name.substring(0, 25) + '...' : insights.topTest.name}</h3>
                                    <p className="text-slate-500 text-sm mt-1">Most popular choice, performed <span className="font-bold text-amber-600">{insights.topTest.count} times</span>.</p>
                                </div>
                            ) : (
                                <p className="text-slate-400 text-sm">No tests performed yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Patients"
                    value={stats.totalPatients}
                    icon={Users}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                    subtitle="Lifetime registrations"
                />
                <StatCard
                    title="Samples Today"
                    value={stats.samplesCollected}
                    icon={Beaker}
                    color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                    trend="up" trendValue="12%"
                />
                <StatCard
                    title="Pending Reports"
                    value={stats.pendingReports}
                    icon={Clock}
                    color="bg-gradient-to-br from-amber-500 to-orange-600"
                    trend="up" trendValue="5" // Meaning 5 more than usual/yesterday
                    subtitle="Action needed"
                />
                <StatCard
                    title="Total Revenue"
                    value={`₹${stats.revenue.toLocaleString()}`}
                    icon={Activity}
                    color="bg-gradient-to-br from-emerald-500 to-teal-600"
                    trend="up" trendValue="8%"
                />
            </div>

            {/* Main Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Chart - Takes 2/3 */}
                <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Revenue Analytics</h3>
                            <p className="text-sm text-slate-400">Income vs Order volume</p>
                        </div>
                        <select
                            className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2 outline-none"
                            value={chartPeriod}
                            onChange={(e) => setChartPeriod(e.target.value)}
                        >
                            <option value="week">Last 7 Days</option>
                            <option value="month">This Month</option>
                        </select>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                        <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                        <feMerge>
                                            <feMergeNode in="coloredBlur" />
                                            <feMergeNode in="SourceGraphic" />
                                        </feMerge>
                                    </filter>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />   {/* Increased opacity */}
                                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />   {/* Increased opacity */}
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans', opacity: 0.7 }}
                                    dy={10}
                                />
                                <YAxis
                                    yAxisId="left"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'Plus Jakarta Sans', opacity: 0.7 }}
                                    tickFormatter={(value) => `₹${value}`}
                                />
                                <YAxis yAxisId="right" orientation="right" hide />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                        fontFamily: 'Plus Jakarta Sans',
                                        padding: '12px 16px'
                                    }}
                                    itemStyle={{ color: '#0f766e', fontWeight: 700, fontSize: '12px' }}
                                    labelStyle={{ color: '#64748b', fontSize: '11px', fontWeight: 600, marginBottom: '4px' }}
                                    cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '4 4' }}
                                />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue (₹)"
                                    stroke="#14b8a6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRev)"
                                    filter="url(#glow)"
                                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#14b8a6' }}
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="orders"
                                    name="Orders"
                                    stroke="#6366f1"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorOrd)"
                                    filter="url(#glow)"
                                    activeDot={{ r: 6, strokeWidth: 4, stroke: '#fff', fill: '#6366f1' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Demographics Chart - Takes 1/3 */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Patient Demographics</h3>
                    <p className="text-sm text-slate-400 mb-6">Distribution by gender</p>
                    <div className="flex-1 min-h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={demographicsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {demographicsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                            <span className="text-3xl font-bold text-slate-700">{stats.totalPatients}</span>
                            <span className="block text-xs text-slate-400 uppercase tracking-wide">Patients</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Popular Tests */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Top Performing Tests</h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={popularTests} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                <Bar dataKey="count" fill="#818cf8" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Live Activity Feed</h3>
                        <button className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center">
                            View All <ArrowRight className="h-4 w-4 ml-1" />
                        </button>
                    </div>
                    <div className="space-y-6">
                        {recentActivity.length === 0 ? (
                            <p className="text-slate-400 text-center py-8">No recent activity.</p>
                        ) : (
                            recentActivity.map((item, idx) => (
                                <div key={idx} className="flex gap-4 relative">
                                    {/* Timeline line */}
                                    {idx !== recentActivity.length - 1 && (
                                        <div className="absolute left-[18px] top-8 bottom-[-24px] w-0.5 bg-slate-100"></div>
                                    )}
                                    <div className={`h-9 w-9 rounded-full flex-shrink-0 flex items-center justify-center border-2 z-10 bg-white ${item.type === 'order' ? 'border-indigo-100 text-indigo-600' : 'border-emerald-100 text-emerald-600'}`}>
                                        {item.type === 'order' ? <FileText className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800">{item.title}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 mb-1">{item.desc}</p>
                                        <span className="text-[10px] bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                                            {item.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

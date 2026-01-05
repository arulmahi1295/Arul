import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Beaker, FileText, Menu, X, Activity, DollarSign, Shield, LogOut, Car, History, Leaf } from 'lucide-react';
import { storage } from '../data/storage';

const Layout = ({ onLogout }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [user, setUser] = React.useState({ name: 'User', role: 'Staff' });

    React.useEffect(() => {
        const stored = localStorage.getItem('lis_auth');
        if (stored) {
            const data = JSON.parse(stored);
            setUser({ name: data.user || 'Admin', role: data.role || 'Manager' });
        }
    }, []);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Register Patient', href: '/register', icon: UserPlus },
        { name: 'Phlebotomy', href: '/phlebotomy', icon: Beaker },
        { name: 'Billing History', href: '/billing-history', icon: History },
        { name: 'Home Visit', href: '/home-collection', icon: Car },
        { name: 'Accession', href: '/accession', icon: Activity },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Finance', href: '/finance', icon: DollarSign },
        { name: 'Admin', href: '/admin', icon: Shield },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Desktop */}
            <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm fixed h-full z-10">
                <div className="p-6 border-b border-slate-100 flex flex-col items-center justify-center">
                    <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-3 group transition-transform hover:scale-110 duration-300">
                        <Leaf className="h-10 w-10 text-brand-600" />
                    </div>
                    <span className="text-xl font-bold text-slate-800 tracking-tight">GreenHealth <span className="text-brand-600">Lab</span></span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'
                                        }`}
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                                {user.name.substring(0, 2)}
                            </div>
                            <div className="ml-3">
                                <p className="text-xs font-semibold text-slate-700">{user.name}</p>
                                <p className="text-[10px] text-slate-500">{user.role}</p>
                            </div>
                        </div>
                        {/* Logout removed as per request */}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center">
                        <Leaf className="h-6 w-6 text-brand-600 mr-2" />
                        <span className="text-lg font-bold text-slate-800">GreenHealth Lab</span>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100"
                    >
                        {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-lg z-30 animate-in slide-in-from-top-2">
                        <nav className="p-4 space-y-1">
                            {navigation.map((item) => (
                                <Link
                                    key={item.name}
                                    to={item.href}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-300 group ${isActive
                                        ? 'bg-brand-gradient text-white shadow-lg shadow-brand-500/30 ring-1 ring-white/20'
                                        : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                                        }`}
                                >
                                    <item.icon
                                        className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-brand-500'
                                            }`}
                                    />
                                    {item.name}
                                </Link>
                            ))}
                        </nav>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

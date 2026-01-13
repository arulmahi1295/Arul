import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Beaker, FileText, Menu, X, Activity, DollarSign, Shield, LogOut, Car, History, Leaf, Package } from 'lucide-react';

const Layout = ({ onLogout, userRole }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    // We can use the passed userRole, or fallback to local state if needed (mainly for the name)
    const [user, setUser] = React.useState({ name: 'User', role: 'Staff' });

    React.useEffect(() => {
        const stored = localStorage.getItem('lis_auth');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                // Update local user state for display name
                setUser({
                    name: data.user || 'User',
                    role: data.role || 'Staff'
                });
            } catch (e) {
                console.error("Layout Auth Parse Error", e);
            }
        }
    }, []);

    // Use prop if available, otherwise state
    const currentRole = userRole || user.role;

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Register Patient', href: '/register', icon: UserPlus },
        { name: 'Phlebotomy', href: '/phlebotomy', icon: Beaker },
        { name: 'Billing History', href: '/billing-history', icon: History },
        { name: 'Home Visit', href: '/home-collection', icon: Car },
        { name: 'Accession', href: '/accession', icon: Activity },
        { name: 'Reports', href: '/reports', icon: FileText },

        // Conditional Items based on Role
        ...(currentRole === 'Admin' ? [
            { name: 'Finance', href: '/finance', icon: DollarSign },
            { name: 'Inventory', href: '/inventory', icon: Package },
            { name: 'Admin', href: '/admin', icon: Shield },
        ] : [])
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

                <nav className="flex-1 space-y-2 py-4">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-6 py-3.5 text-sm font-medium transition-all duration-200 group relative ${isActive
                                    ? 'text-emerald-800 bg-gradient-to-r from-emerald-50 to-white border-l-4 border-emerald-600'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                                    }`}
                            >
                                <item.icon
                                    className={`mr-3 h-5 w-5 transition-colors ${isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-slate-600'
                                        }`}
                                />
                                {item.name}
                                {isActive && <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />}
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
                                <p className="text-[10px] text-slate-500">{currentRole}</p>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="p-2 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                            title="Logout"
                        >
                            <LogOut className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full relative bg-slate-50/50">
                {/* Premium Background Layer */}
                <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden md:ml-64">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-emerald-50/30"></div>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.06]"></div>
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-100/40 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-teal-100/40 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
                    <div className="absolute bottom-10 right-10 opacity-[0.07] transform -rotate-12">
                        <Leaf className="h-[30rem] w-[30rem] text-emerald-800" />
                    </div>
                </div>

                {/* Mobile Header */}
                <div className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
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
                            {navigation.map((item) => {
                                const isActive = location.pathname === item.href;
                                return (
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
                                );
                            })}
                            <button
                                onClick={onLogout}
                                className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <LogOut className="mr-3 h-5 w-5 text-slate-400 group-hover:text-red-500" />
                                <span className="text-red-600">Logout</span>
                            </button>
                        </nav>
                    </div>
                )}

                <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative">
                    <div className="max-w-7xl mx-auto w-full">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;

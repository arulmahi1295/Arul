import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Beaker, FileText, Menu, X, Activity } from 'lucide-react';

const Layout = () => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    const navigation = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Register Patient', href: '/register', icon: UserPlus },
        { name: 'Phlebotomy', href: '/phlebotomy', icon: Beaker },
        { name: 'Tracking', href: '/samples', icon: Activity },
        { name: 'Reports', href: '/reports', icon: FileText },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar - Desktop */}
            <div className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm fixed h-full z-10">
                <div className="p-6 border-b border-slate-100 flex items-center justify-center">
                    <div className="h-10 w-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-md">
                        <Beaker className="h-6 w-6 text-white" />
                    </div>
                    <span className="ml-3 text-xl font-bold text-slate-800 tracking-tight">LIMS<span className="text-indigo-600">Pro</span></span>
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
                    <div className="flex items-center px-4 py-3 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            JD
                        </div>
                        <div className="ml-3">
                            <p className="text-xs font-semibold text-slate-700">Jane Doe</p>
                            <p className="text-[10px] text-slate-500">Phlebotomist</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full">
                {/* Mobile Header */}
                <div className="md:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-20">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                            <Beaker className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-lg font-bold text-slate-800">LIMSPro</span>
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
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${location.pathname === item.href
                                        ? 'bg-indigo-50 text-indigo-700'
                                        : 'text-slate-600 hover:bg-slate-50'
                                        }`}
                                >
                                    <item.icon className="mr-3 h-5 w-5" />
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

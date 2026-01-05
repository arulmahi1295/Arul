import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, ShieldCheck, Leaf, Activity, Heart, Droplet, Clock, ChevronRight } from 'lucide-react';
import { storage } from '../data/storage';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentSlide, setCurrentSlide] = useState(0);

    const healthTips = [
        {
            title: "Precision Diagnostics",
            desc: "State-of-the-art analyzers ensuring 99.9% accuracy in your reports.",
            icon: Activity
        },
        {
            title: "Why CBC Matters?",
            desc: "A Complete Blood Count detects anemia, infection, and immune system disorders early.",
            icon: Droplet
        },
        {
            title: "Diabetes Care (HbA1c)",
            desc: "The gold standard for monitoring long-term blood sugar control over the last 3 months.",
            icon: Heart
        },
        {
            title: "Fast Turnaround",
            desc: "Get most routine test results within 4-6 hours. Speed meets reliability.",
            icon: Clock
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % healthTips.length);
        }, 4000);
        return () => clearInterval(timer);
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        setTimeout(() => {
            const users = storage.getUsers();
            let userToLogin = null;
            let foundUser = null;

            if (username.trim()) {
                foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());
                if (!foundUser) {
                    userToLogin = {
                        name: username,
                        role: 'Staff',
                        token: 'temp-token-' + Date.now(),
                        status: 'Active'
                    };
                }
            } else {
                foundUser = users.find(u => u.username.toLowerCase() === 'admin');
                if (!foundUser) {
                    userToLogin = {
                        name: 'Admin',
                        role: 'Admin',
                        token: 'admin-token-' + Date.now(),
                        status: 'Active'
                    };
                }
            }

            if (foundUser) {
                if (foundUser.status === 'Inactive') {
                    setError('Account is inactive. Contact Admin.');
                    setIsLoading(false);
                    return;
                }
                userToLogin = {
                    name: foundUser.username,
                    role: foundUser.role,
                    token: 'mock-token-' + Date.now(),
                    department: foundUser.department,
                    id: foundUser.id,
                    status: foundUser.status
                };
            }

            if (!userToLogin) {
                setError('Login failed. User not found.');
                setIsLoading(false);
                return;
            }

            const sessionData = {
                user: userToLogin.name,
                role: userToLogin.role,
                token: userToLogin.token,
                department: userToLogin.department,
                id: userToLogin.id
            };

            localStorage.setItem('lis_auth', JSON.stringify(sessionData));
            onLogin(sessionData);
            navigate('/');

        }, 600);
    };

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white overflow-hidden">
            {/* Left Side - Login Form */}
            <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12 lg:p-16 relative z-10 bg-white order-2 md:order-1">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center md:text-left">
                        <div className="h-16 w-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-6 mx-auto md:mx-0">
                            <Leaf className="h-8 w-8 text-brand-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
                        <p className="text-slate-500 mt-2">Enter your credentials to access the GreenHealth Lab system.</p>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center animate-in slide-in-from-top-2">
                            <ShieldCheck className="h-5 w-5 mr-2" />
                            {error}
                        </div>
                    )}

                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start">
                        <ShieldCheck className="h-5 w-5 text-emerald-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-emerald-800">Quick Access Enabled</h3>
                            <p className="text-xs text-emerald-600 mt-1">Global password requirements disabled for rapid staff access.</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Username / Login ID</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:ring-4 focus:ring-brand-50/50 outline-none text-slate-700 transition-all font-medium bg-slate-50 focus:bg-white"
                                    placeholder="Enter username (default: Admin)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3.5 bg-brand-gradient text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 hover:-translate-y-0.5 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Verifying Access...
                                </span>
                            ) : (
                                <>
                                    Enter Dashboard <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-400">
                            <span>Terms of Service</span>
                            <span>•</span>
                            <span>Privacy Policy</span>
                            <span>•</span>
                            <span>Help Center</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-4">
                            © 2026 GreenHealth Lab • v2.1 • Authorized Personnel Only
                        </p>
                    </div>
                </div>
            </div>

            {/* Right Side - Health Info Carousel */}
            <div className="w-full md:w-1/2 relative bg-slate-900 overflow-hidden order-1 md:order-2 h-64 md:h-auto">
                <div className="absolute inset-0">
                    <img
                        src="/login_background.png"
                        alt="Lab"
                        className="w-full h-full object-cover opacity-60 md:opacity-100"
                    />
                    <div className="absolute inset-0 bg-brand-900/60 md:bg-brand-900/40 backdrop-blur-[1px] md:backdrop-blur-none bg-gradient-to-t from-brand-900/90 to-transparent"></div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 lg:p-16 text-white max-w-xl mx-auto md:mx-0">
                    <div className="relative h-48 md:h-56">
                        {healthTips.map((tip, index) => (
                            <div
                                key={index}
                                className={`absolute top-0 left-0 w-full transition-all duration-700 ease-in-out transform ${index === currentSlide
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-8 pointer-events-none'
                                    }`}
                            >
                                <div className="h-14 w-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                                    <tip.icon className="h-7 w-7 text-white" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{tip.title}</h2>
                                <p className="text-brand-50 text-base md:text-lg leading-relaxed font-light">{tip.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Indicators */}
                    <div className="flex space-x-2 mt-4 absolute bottom-8 md:bottom-12 lg:bottom-16">
                        {healthTips.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                className={`h-1.5 transition-all duration-300 rounded-full ${index === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/30 hover:bg-white/50'
                                    }`}
                                aria-label={`Go to slide for ${healthTips[index].title}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

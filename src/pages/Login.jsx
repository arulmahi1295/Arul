import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, ArrowRight, User, ShieldCheck, Leaf, Activity, Heart, Droplet, Brain, Lock } from 'lucide-react';
import { storage } from '../data/storage';
import { logAuth } from '../utils/activityLogger';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeTestIndex, setActiveTestIndex] = useState(0);

    const commonTests = [
        {
            title: "Complete Blood Count (CBC)",
            desc: "Evaluates overall health and detects a wide range of disorders, including anemia, infection, and leukemia.",
            icon: Droplet
        },
        {
            title: "Lipid Profile",
            desc: "Measures cholesterol and triglycerides to assess risk for cardiovascular disease.",
            icon: Heart
        },
        {
            title: "Thyroid Function Test",
            desc: "Checks how well your thyroid gland is working and diagnosing hyperthyroidism or hypothyroidism.",
            icon: Activity
        },
        {
            title: "HbA1c (Glycated Hemoglobin)",
            desc: "Average blood sugar (glucose) levels for the last two to three months. Key for diabetes management.",
            icon: Beaker
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveTestIndex((prev) => (prev + 1) % commonTests.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Artificial delay for UX + Data Fetch
            await new Promise(r => setTimeout(r, 800));

            const users = await storage.getUsers();
            console.log('DEBUG: storage.getUsers() returned:', users);
            let foundUser = null;

            // Strict Search
            if (username.trim()) {
                foundUser = users.find(u =>
                    u.username.toLowerCase() === username.trim().toLowerCase() &&
                    u.password === password
                );
            }

            if (foundUser) {
                if (foundUser.status === 'Inactive') {
                    setError('Account Validation Failed: User is inactive.');
                    setIsLoading(false);
                    return;
                }

                const sessionData = {
                    user: foundUser.username,
                    role: foundUser.role,
                    token: 'token-' + Date.now(),
                    department: foundUser.department,
                    id: foundUser.id,
                    status: foundUser.status
                };

                localStorage.setItem('lis_auth', JSON.stringify(sessionData));

                // Log successful login
                await logAuth.loginSuccess(foundUser.username, foundUser.id);

                onLogin(sessionData);
                navigate('/');
            } else {
                // Log failed login attempt
                await logAuth.loginFailed(username, 'Invalid credentials');

                setError('Authentication Failed: Invalid credentials.');
                setIsLoading(false);
            }
        } catch (err) {
            console.error("Login Error", err);
            setError('System Error: Unable to connect to database.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full relative flex flex-col lg:flex-row items-center justify-center p-4 lg:p-0 overflow-hidden">
            {/* Full Screen Background Image */}
            <div
                className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transform scale-105"
                style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&auto=format&fit=crop&w=2500&q=80')"
                }}
            >
                {/* Gradient Overlay - Dark on left for text, Light on right for freshness */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-emerald-800/20"></div>
            </div>

            <div className="max-w-7xl w-full relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 lg:px-12">

                {/* Left Side: Branding & Education (Text on Image) */}
                <div className="w-full lg:w-1/2 text-white p-6 lg:p-0 mt-8 lg:mt-0 text-center lg:text-left">
                    <div className="flex items-center gap-6 mb-10">
                        <div className="h-20 w-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-xl">
                            <Leaf className="h-10 w-10 text-emerald-300" />
                        </div>
                        <div>
                            <h1 className="text-4xl lg:text-7xl font-bold tracking-tight mb-2 font-sans drop-shadow-lg">GreenHealth</h1>
                            <p className="text-emerald-300 font-bold tracking-[0.2em] text-sm lg:text-xl uppercase drop-shadow-md">Diagnostic Laboratories</p>
                        </div>
                    </div>

                    <div className="space-y-6 max-w-lg">
                        <h2 className="text-3xl font-light leading-tight">
                            Precision diagnostics for <br />
                            <span className="font-bold text-emerald-300">better living.</span>
                        </h2>

                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 shadow-lg">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-emerald-500 rounded-xl shadow-lg">
                                    {React.createElement(commonTests[activeTestIndex].icon, { className: "h-6 w-6 text-white" })}
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold mb-1">{commonTests[activeTestIndex].title}</h3>
                                    <p className="text-emerald-100 text-sm leading-relaxed opacity-90">
                                        {commonTests[activeTestIndex].desc}
                                    </p>
                                </div>
                            </div>

                            {/* Indicators */}
                            <div className="flex gap-2 mt-4 ml-16">
                                {commonTests.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveTestIndex(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${idx === activeTestIndex ? 'w-8 bg-emerald-400' : 'w-2 bg-white/20 hover:bg-white/40'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Login Card (Glass) */}
                <div className="w-full lg:w-[480px]">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl overflow-hidden border border-white/40 p-8 lg:p-10 relative">
                        {/* Decorative top gloss */}
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500"></div>

                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-bold text-slate-800">Staff Portal</h2>
                            <p className="text-slate-500 text-sm mt-1">Authorized Personnel Only</p>
                        </div>

                        {error && (
                            <div className="mb-6 p-4 bg-red-50/80 border border-red-100 rounded-xl text-red-600 text-sm font-medium flex items-center animate-in fade-in slide-in-from-top-1">
                                <ShieldCheck className="h-5 w-5 mr-2" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Username / ID</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <User className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full pl-14 pr-4 py-4 rounded-xl border border-slate-200/60 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-700 transition-all font-semibold placeholder:text-slate-400"
                                        placeholder="Username"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 bg-white rounded-lg shadow-sm border border-slate-100">
                                        <Lock className="h-4 w-4 text-emerald-600" />
                                    </div>
                                    <input
                                        type="password"
                                        className="w-full pl-14 pr-4 py-4 rounded-xl border border-slate-200/60 bg-white/50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none text-slate-700 transition-all font-semibold placeholder:text-slate-400"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <span className="flex items-center gap-2">
                                        <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                        Authenticating...
                                    </span>
                                ) : (
                                    <>
                                        Sign In <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                            <ShieldCheck className="h-3 w-3" />
                            <span>Secured by GreenHealth Guard</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Credits */}
            <div className="absolute bottom-4 left-0 w-full text-center text-emerald-100/40 text-[10px] z-10">
                GreenHealth Laboratory Information System v2.2 • © 2026
            </div>
        </div>
    );
};

export default Login;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Beaker, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { storage } from '../data/storage';

const Login = ({ onLogin }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate network delay
        setTimeout(() => {
            const users = storage.getUsers();
            let userToLogin = null;
            let foundUser = null;

            if (username.trim()) {
                // Try to find existing user
                foundUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

                if (!foundUser) {
                    // Create temporary session for new name if user doesn't exist
                    userToLogin = {
                        name: username,
                        role: 'Staff',
                        token: 'temp-token-' + Date.now(),
                        status: 'Active'
                    };
                }
            } else {
                // Default to Admin if empty
                foundUser = users.find(u => u.username.toLowerCase() === 'admin');

                if (!foundUser) {
                    // Fallback if Admin not found in storage
                    userToLogin = {
                        name: 'Admin',
                        role: 'Admin',
                        token: 'admin-token-' + Date.now(),
                        status: 'Active'
                    };
                }
            }

            // If a user was found in storage (either by username or default Admin search)
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
                setError('Login failed. User not found or invalid.');
                setIsLoading(false);
                return;
            }

            // Create session data
            const sessionData = {
                user: userToLogin.name,
                role: userToLogin.role,
                token: userToLogin.token,
                department: userToLogin.department,
                id: userToLogin.id
            };

            localStorage.setItem('lis_auth', JSON.stringify(sessionData));

            onLogin(sessionData); // Pass sessionData to onLogin
            navigate('/');

        }, 600);
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="bg-brand-gradient p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="h-20 w-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm shadow-lg">
                            <img src="/logo.png" alt="Logo" className="h-12 w-auto mix-blend-multiply opacity-90" />
                        </div>
                        <h1 className="text-2xl font-bold text-white mb-1">NovaPath Labs</h1>
                        <p className="text-indigo-100 text-sm">Laboratory Information System</p>
                    </div>
                </div>

                <div className="p-8">
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start">
                        <ShieldCheck className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-sm font-bold text-blue-800">Quick Access Enabled</h3>
                            <p className="text-xs text-blue-600 mt-1">Password requirements have been disabled for streamlined access.</p>
                        </div>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-600 mb-2">Username / ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none text-slate-700 transition-all font-medium"
                                    placeholder="Enter username (default: Admin)"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    Accessing System...
                                </span>
                            ) : (
                                <>
                                    Enter System <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-100 pt-6">
                        <p className="text-xs text-slate-400">
                            Authorized Access Only • v1.2.0-secure
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;

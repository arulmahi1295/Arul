import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Calendar, CheckCircle, Activity, AlertCircle, CreditCard, Clock, Search, ChevronRight, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../data/storage';
import { logPatient } from '../utils/activityLogger';

const InputField = ({ label, icon: Icon, error, ...props }) => (
    <div className="group">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
        <div className="relative transition-all duration-300">
            <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 ${error ? 'text-rose-400' : 'text-slate-400 group-focus-within:text-indigo-500'} transition-colors`} />
            <input
                {...props}
                className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 ${error ? 'border-rose-100 bg-rose-50 text-rose-900 focus:border-rose-500' : 'border-slate-100 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10'} outline-none transition-all placeholder:text-slate-400 font-medium`}
            />
        </div>
        {error && <p className="text-xs text-rose-500 mt-1 ml-1 font-medium flex items-center"><AlertCircle className="h-3 w-3 mr-1" />{error}</p>}
    </div>
);

const SelectField = ({ label, icon: Icon, children, ...props }) => (
    <div className="group">
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">{label}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />}
            <select
                {...props}
                className={`w-full ${Icon ? 'pl-12' : 'px-4'} pr-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium appearance-none`}
            >
                {children}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </div>
        </div>
    </div>
);

const PatientRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
        dob: '',
        gender: 'male',
        phone: '',
        email: '',
        address: '',
        bloodGroup: '',
        medicalConditions: '',
        medications: '',
        allergies: '',
        paymentMode: 'Cash',
        source: 'Walk-in',
        referralId: 'Self',
        homeCollectionCharges: '' // New field
    });
    const [referrals, setReferrals] = useState([]);
    const [recentPatients, setRecentPatients] = useState([]);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [savedPatientId, setSavedPatientId] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [submitError, setSubmitError] = useState(null);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        const refs = await storage.getReferrals();
        setReferrals(refs || []);
        const patients = await storage.getPatients();
        if (patients) {
            setRecentPatients(patients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (formData.fullName.length < 3) newErrors.fullName = 'Name must be at least 3 characters';
        const ageNum = parseInt(formData.age);
        if (!ageNum || ageNum <= 0 || ageNum > 120) newErrors.age = 'Invalid age';
        if (formData.dob) {
            if (new Date(formData.dob) > new Date()) newErrors.dob = 'Future date not allowed';
        }
        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';
        // Validate Home Collection Charges if source is Home Collection
        if (formData.source === 'Home Collection' && !formData.homeCollectionCharges) {
            // Optional: make it required or default to 0. Let's not block, but good to know.
            // newErrors.homeCollectionCharges = "Required";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitError(null);
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const patientId = await storage.getNextPatientId();
            const patientData = { ...formData, id: patientId };
            await storage.savePatient(patientData);

            // Log patient creation
            await logPatient.created(patientId, formData.fullName);

            setSavedPatientId(patientId);
            setIsSubmitted(true);
            setShowSuccessModal(true);
            loadInitialData(); // Refresh recent list
        } catch (error) {
            setSubmitError("Failed to save patient. Please check connection.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'dob') {
            const dobDate = new Date(value);
            const today = new Date();
            if (!isNaN(dobDate.getTime())) {
                let calculatedAge = today.getFullYear() - dobDate.getFullYear();
                const m = today.getMonth() - dobDate.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) calculatedAge--;
                if (calculatedAge >= 0) setFormData(prev => ({ ...prev, dob: value, age: calculatedAge.toString() }));
                else setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else if (name === 'age') {
            const ageNum = parseInt(value);
            if (!isNaN(ageNum) && ageNum > 0 && ageNum <= 120) {
                const estimatedYear = new Date().getFullYear() - ageNum;
                setFormData(prev => ({ ...prev, age: value, dob: `${estimatedYear}-01-01` }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProceed = () => {
        navigate('/phlebotomy', {
            state: {
                prefillPatient: formData.fullName,
                patientId: savedPatientId,
                patientName: formData.fullName,
                paymentMode: formData.paymentMode,
                homeCollectionCharges: formData.source === 'Home Collection' ? parseInt(formData.homeCollectionCharges || 0) : 0 // Pass Charge
            }
        });
    };

    // Components defined outside for performance

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patient Registration</h1>
                <p className="text-slate-500">Create new patient records and manage demographics.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Registration Form - Takes 2/3 width */}
                <div className="lg:col-span-2">
                    <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-8 space-y-8">
                            {/* Personal Information */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Personal Information</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <InputField label="Full Name" icon={User} name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="e.g. John Doe" required />
                                    </div>
                                    <InputField label="Date of Birth" icon={Calendar} type="date" name="dob" value={formData.dob} onChange={handleChange} error={errors.dob} />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField label="Age" icon={Activity} type="number" name="age" value={formData.age} onChange={handleChange} error={errors.age} required placeholder="Yrs" />
                                        <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </SelectField>
                                    </div>
                                    <SelectField label="Payment Mode" icon={CreditCard} name="paymentMode" value={formData.paymentMode} onChange={handleChange}>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI / Online</option>
                                        <option value="Insurance">Insurance</option>
                                    </SelectField>
                                    <div className="grid grid-cols-2 gap-4">
                                        <SelectField label="Source" name="source" value={formData.source} onChange={handleChange}>
                                            <option value="Walk-in">Walk-in</option>
                                            <option value="Home Collection">Home Collection</option>
                                            <option value="Corporate">Corporate</option>
                                        </SelectField>
                                        <SelectField label="Referral" name="referralId" value={formData.referralId} onChange={handleChange}>
                                            <option value="Self">Self (Default)</option>
                                            {referrals.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </SelectField>
                                    </div>
                                    {formData.source === 'Home Collection' && (
                                        <div className="md:col-span-2 bg-emerald-50 rounded-xl p-4 border border-emerald-100 animate-in fade-in slide-in-from-top-2">
                                            <InputField
                                                label="Home Collection Charges (₹)"
                                                icon={MapPin}
                                                type="number"
                                                name="homeCollectionCharges"
                                                value={formData.homeCollectionCharges}
                                                onChange={handleChange}
                                                placeholder="Enter amount"
                                                min="0"
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Contact Details */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Contact Details</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputField label="Phone Number" icon={Phone} type="tel" name="phone" value={formData.phone} onChange={handleChange} error={errors.phone} required placeholder="10-digit mobile" />
                                    <InputField label="Email Address" icon={Mail} type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Optional" />
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Address</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-4 top-4 h-5 w-5 text-slate-400" />
                                            <textarea
                                                name="address"
                                                rows="2"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-100 bg-slate-50 text-slate-800 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400 font-medium resize-none"
                                                placeholder="Full residential address"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <hr className="border-slate-100" />

                            {/* Medical History */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-800">Medical Context</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SelectField label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                                        <option value="">Unknown / Select</option>
                                        <option value="A+">A+</option>
                                        <option value="A-">A-</option>
                                        <option value="B+">B+</option>
                                        <option value="B-">B-</option>
                                        <option value="O+">O+</option>
                                        <option value="O-">O-</option>
                                        <option value="AB+">AB+</option>
                                        <option value="AB-">AB-</option>
                                    </SelectField>
                                    <InputField label="Conditions" icon={Activity} name="medicalConditions" value={formData.medicalConditions} onChange={handleChange} placeholder="e.g. Diabetes" />
                                </div>
                            </section>
                        </div>

                        <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ fullName: '', age: '', dob: '', gender: 'male', phone: '', email: '', address: '', bloodGroup: '', medicalConditions: '', medications: '', allergies: '', paymentMode: 'Cash', source: 'Walk-in', referralId: 'Self' })}
                                className="px-6 py-3 rounded-xl text-slate-600 font-bold hover:bg-slate-200 transition-colors text-sm"
                            >
                                Reset Form
                            </button>
                            <button
                                type="submit"
                                disabled={isSaving || isSubmitted}
                                className={`px-8 py-3 rounded-xl text-white font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transform hover:-translate-y-0.5 transition-all text-sm flex items-center ${isSubmitted ? 'bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {isSubmitted ? <><CheckCircle className="h-5 w-5 mr-2" /> Registered</> : isSaving ? 'Saving...' : <><UserPlus className="h-5 w-5 mr-2" /> Register Patient</>}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Sidebar: Recent Registrations - Takes 1/3 width */}
                <div className="space-y-6">
                    <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                        <h3 className="text-xl font-bold mb-2">Registration Tips</h3>
                        <ul className="text-indigo-100 text-sm space-y-2 list-disc list-inside opacity-90">
                            <li>Check for existing patients first</li>
                            <li>Verify mobile number with OTP if enabled</li>
                            <li>Collect insurance details upfront</li>
                        </ul>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                            <Clock className="h-5 w-5 mr-2 text-slate-400" />
                            Recent Registrations
                        </h3>
                        <div className="space-y-4">
                            {recentPatients.length === 0 ? (
                                <p className="text-slate-400 text-sm text-center py-4">No recent patients found.</p>
                            ) : (
                                recentPatients.map(p => (
                                    <div key={p.id} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                                {p.fullName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.fullName}</p>
                                                <p className="text-xs text-slate-400">{p.gender}, {p.age}y</p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-mono text-slate-300 bg-slate-100 px-2 py-1 rounded-md">{p.id.slice(-4)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button onClick={() => navigate('/directory')} className="w-full mt-4 py-3 text-sm font-bold text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors">
                            View All Patients
                        </button>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 animate-in fade-in zoom-in duration-300">
                        <div className="text-center mb-8">
                            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <CheckCircle className="h-10 w-10 text-emerald-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-2">Registration Complete</h2>
                            <p className="text-slate-500 text-lg">Patient ID: <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">{savedPatientId}</span></p>
                        </div>
                        <div className="space-y-3">
                            <button onClick={() => navigate('/print/patient-card', { state: { patientId: savedPatientId } })} className="w-full py-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center">
                                Print Card <CheckCircle className="h-5 w-5 ml-2 opacity-50" />
                            </button>
                            <button onClick={handleProceed} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center">
                                Proceed to Tests <ChevronRight className="h-5 w-5 ml-2" />
                            </button>
                            <button onClick={() => { setShowSuccessModal(false); setIsSubmitted(false); setSavedPatientId(null); setFormData({ fullName: '', age: '', dob: '', gender: 'male', phone: '', email: '', address: '', bloodGroup: '', medicalConditions: '', medications: '', allergies: '', paymentMode: 'Cash', source: 'Walk-in', referralId: '' }); }} className="w-full py-4 text-slate-500 hover:text-slate-700 font-bold transition-all">
                                New Patient
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientRegistration;

import React, { useState } from 'react';
import { User, Phone, Mail, MapPin, Calendar, CheckCircle, Activity, AlertCircle, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { storage } from '../data/storage';

const PatientRegistration = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: '',
        age: '',
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
        referralId: ''
    });
    const [referrals, setReferrals] = useState([]);

    React.useEffect(() => {
        setReferrals(storage.getReferrals());
    }, []);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [errors, setErrors] = useState({});
    const [savedPatientId, setSavedPatientId] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validateForm = () => {
        const newErrors = {};
        if (formData.fullName.length < 3) newErrors.fullName = 'Name must be at least 3 characters';

        const ageNum = parseInt(formData.age);
        if (!ageNum || ageNum <= 0 || ageNum > 120) newErrors.age = 'Invalid age (1-120)';

        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone must be 10 digits';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        // Generate ID and save to storage
        const patientId = storage.getNextPatientId();
        const patientData = { ...formData, id: patientId };
        storage.savePatient(patientData);

        console.log('Patient Saved:', patientData);
        setSavedPatientId(patientId);
        setIsSubmitted(true);
        setShowSuccessModal(true);
    };

    const handleProceed = () => {
        navigate('/phlebotomy', {
            state: {
                prefillPatient: formData.fullName,
                patientId: savedPatientId,
                patientName: formData.fullName,
                paymentMode: formData.paymentMode
            }
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">New Patient Registration</h1>
                    <p className="text-slate-500 mt-1">Enter patient details securely to create a new record.</p>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                >
                    Cancel
                </button>
            </header>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Personal Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Personal Information</h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="text"
                                        name="fullName"
                                        required
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.fullName ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'} outline-none transition-all`}
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                                {errors.fullName && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.fullName}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                                    <input
                                        type="number"
                                        name="age"
                                        required
                                        value={formData.age}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 rounded-xl border ${errors.age ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'} outline-none transition-all`}
                                        placeholder="Age"
                                    />
                                    {errors.age && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.age}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                                    <select
                                        name="gender"
                                        value={formData.gender}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Payment Mode</label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <select
                                        name="paymentMode"
                                        value={formData.paymentMode}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                                    >
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="UPI">UPI / Online</option>
                                        <option value="Insurance">Insurance</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Patient Source</label>
                                    <select
                                        name="source"
                                        value={formData.source}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                                    >
                                        <option value="Walk-in">Walk-in</option>
                                        <option value="Home Collection">Home Collection</option>
                                        <option value="Corporate">Corporate</option>
                                        <option value="Camp">Camp</option>
                                        <option value="Direct">Direct / Self</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Referral (Optional)</label>
                                    <select
                                        name="referralId"
                                        value={formData.referralId}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                                    >
                                        <option value="">-- No Referral --</option>
                                        {referrals.map(r => (
                                            <option key={r.id} value={r.id}>{r.name} ({r.type})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info Section */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2 mb-4">Contact Details</h3>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border ${errors.phone ? 'border-rose-500 ring-1 ring-rose-500' : 'border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'} outline-none transition-all`}
                                        placeholder="10 digit number"
                                    />
                                </div>
                                {errors.phone && <p className="text-xs text-rose-500 mt-1 ml-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                    <textarea
                                        name="address"
                                        rows="3"
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                                        placeholder="Full residential address"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical History Section */}
                    <div className="mt-8 pt-8 border-t border-slate-100">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center">
                            <Activity className="mr-2 h-5 w-5 text-indigo-500" />
                            Medical History
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Blood Group</label>
                                <select
                                    name="bloodGroup"
                                    value={formData.bloodGroup}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                                >
                                    <option value="">Select Blood Group</option>
                                    <option value="A+">A+</option>
                                    <option value="A-">A-</option>
                                    <option value="B+">B+</option>
                                    <option value="B-">B-</option>
                                    <option value="O+">O+</option>
                                    <option value="O-">O-</option>
                                    <option value="AB+">AB+</option>
                                    <option value="AB-">AB-</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Existing Medical Conditions</label>
                                <textarea
                                    name="medicalConditions"
                                    rows="2"
                                    value={formData.medicalConditions}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                                    placeholder="e.g. Diabetes, Hypertension"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Medications</label>
                                <textarea
                                    name="medications"
                                    rows="2"
                                    value={formData.medications}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                                    placeholder="List any medications currently being taken"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                                <div className="relative">
                                    <AlertCircle className="absolute left-3 top-3 h-5 w-5 text-rose-400" />
                                    <textarea
                                        name="allergies"
                                        rows="2"
                                        value={formData.allergies}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-rose-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 outline-none transition-all resize-none"
                                        placeholder="List any known allergies"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50 px-8 py-4 flex items-center justify-end border-t border-slate-100">
                    <button
                        type="button"
                        className="mr-3 px-6 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
                        onClick={() => setFormData({
                            fullName: '', age: '', gender: 'male', phone: '', email: '', address: '',
                            bloodGroup: '', medicalConditions: '', medications: '', allergies: '', paymentMode: 'Cash',
                            source: 'Walk-in', referralId: ''
                        })}
                    >
                        Reset
                    </button>
                    <button
                        type="submit"
                        className={`px-6 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-md hover:shadow-lg flex items-center ${isSubmitted ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isSubmitted ? (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Registered Successfully
                            </>
                        ) : (
                            'Register Patient'
                        )}
                    </button>
                </div>
            </form>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-emerald-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800">Registration Successful</h2>
                            <p className="text-slate-500 mt-2">Patient has been registered with ID <span className="font-mono font-bold text-slate-700">{savedPatientId}</span></p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => {
                                    navigate('/print/patient-card', { state: { patientId: savedPatientId } });
                                }}
                                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-medium transition-colors flex items-center justify-center"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                                </svg>
                                Print Patient Card
                            </button>
                            <button
                                onClick={handleProceed}
                                className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
                            >
                                Proceed to Test Selection
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    setIsSubmitted(false);
                                    setSavedPatientId(null);
                                    setFormData({
                                        fullName: '', age: '', gender: 'male', phone: '', email: '', address: '',
                                        bloodGroup: '', medicalConditions: '', medications: '', allergies: '',
                                        source: 'Walk-in', referralId: ''
                                    });
                                }}
                                className="w-full py-3 px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors"
                            >
                                Close & Register New Patient
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientRegistration;

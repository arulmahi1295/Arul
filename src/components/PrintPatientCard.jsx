import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Calendar, MapPin, Phone } from 'lucide-react';
import { storage } from '../data/storage';

const PrintPatientCard = () => {
    const location = useLocation();
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        if (location.state && location.state.patient) {
            setPatient(location.state.patient);
        } else if (location.state && location.state.patientId) {
            const patients = storage.getPatients();
            const found = patients.find(p => p.id === location.state.patientId);
            if (found) setPatient(found);
        }
    }, [location.state]);

    useEffect(() => {
        if (patient) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [patient]);

    if (!patient) return <div className="p-8 text-center text-slate-500">Loading patient card...</div>;

    return (
        <div className="bg-white min-h-screen p-8 flex items-start justify-center print:p-0 print:items-start print:justify-start">
            <div className="border-2 border-slate-800 rounded-xl w-[85mm] h-[54mm] relative overflow-hidden flex flex-col bg-white print:border-2">
                {/* Header */}
                <div className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center">
                    <h1 className="font-bold text-sm tracking-wide">GreenHealth Lab</h1>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">PATIENT CARD</span>
                </div>

                {/* Content */}
                <div className="flex-1 p-4 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight mb-1">{patient.fullName}</h2>
                            <p className="text-xs text-slate-600 font-medium">{patient.age} Years / {patient.gender}</p>
                            <p className="text-xs text-slate-500 mt-1">{patient.phone}</p>
                        </div>
                        <div className="h-16 w-16 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-center">
                            {/* Placeholder for Photo if needed, or just icon */}
                            <User className="text-slate-300 h-8 w-8" />
                        </div>
                    </div>

                    <div className="mt-2">
                        {/* Barcode Simulation */}
                        <div className="flex items-end space-x-[1px] h-8 w-full opacity-90 mb-1">
                            {[...Array(60)].map((_, i) => (
                                <div key={i} className={`w-full bg-slate-900 ${Math.random() > 0.4 ? 'h-full' : 'h-2/3'}`}></div>
                            ))}
                        </div>
                        <p className="text-center font-mono font-bold text-sm tracking-widest text-slate-900">{patient.id}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrintPatientCard;

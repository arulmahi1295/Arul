import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storage } from '../data/storage';

const PrintLabel = () => {
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        if (location.state && location.state.order) {
            setOrder(location.state.order);
            if (location.state.order.patientId) {
                const rawId = location.state.order.patientId.split(' - ')[0];
                const patients = storage.getPatients();
                const foundPatient = patients.find(p => p.id === rawId);
                setPatient(foundPatient);
            }
        }
    }, [location.state]);

    useEffect(() => {
        if (order) {
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [order]);

    if (!order) return <div className="p-8 text-center text-slate-500">Loading label data...</div>;

    const patientName = patient ? patient.fullName : order.patientId.split(' - ')[1] || 'Unknown';
    const patientId = patient ? patient.id : order.patientId.split(' - ')[0];
    const genderAge = patient ? `${patient.age}/${patient.gender.charAt(0).toUpperCase()}` : '';

    return (
        <div className="bg-white min-h-screen p-8 print:p-0">
            <div className="grid grid-cols-2 gap-4 print:block print:gap-0">
                {order.tests.map((test, index) => (
                    <div key={index} className="border border-slate-300 rounded-lg p-2 w-[50mm] h-[25mm] flex flex-col justify-between mb-4 print:mb-[2mm] print:break-inside-avoid page-break-inside-avoid overflow-hidden relative bg-white">
                        {/* Barcode stripe simulation */}
                        <div className="absolute top-0 right-0 bottom-0 w-2 bg-slate-800"></div>

                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-[10px] font-bold text-slate-900 leading-tight truncate w-32">{patientName}</h3>
                                <p className="text-[9px] text-slate-600 font-medium">{patientId} <span className="mx-1">|</span> {genderAge}</p>
                            </div>
                            <span className="text-[8px] font-bold bg-slate-100 px-1 rounded">{test.code}</span>
                        </div>

                        <div className="flex justify-between items-end mt-1">
                            {/* Barcode visual simulation */}
                            <div className="flex items-end space-x-[1px] h-6 opacity-80">
                                {[...Array(25)].map((_, i) => (
                                    <div key={i} className={`w-[1px] bg-black ${Math.random() > 0.5 ? 'h-full' : 'h-3/4'}`}></div>
                                ))}
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-slate-400">{new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrintLabel;

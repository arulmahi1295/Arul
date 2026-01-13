import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import { storage } from '../data/storage';

const PrintLabel = () => {
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        let orderData = null;

        if (location.state && location.state.order) {
            orderData = location.state.order;
        } else {
            // Try sessionStorage (for window.open from Reports)
            const stored = sessionStorage.getItem('print_label_order');
            if (stored) {
                try {
                    orderData = JSON.parse(stored);
                } catch (e) {
                    console.error("Failed to parse stored label order", e);
                }
            }
        }

        if (orderData) {
            setOrder(orderData);
            if (orderData.patientId) {
                const rawId = orderData.patientId.split(' - ')[0];
                const patients = storage.getPatients();
                const foundPatient = patients.find(p => p.id === rawId);
                setPatient(foundPatient);
            }
        }
    }, [location.state]);

    useEffect(() => {
        if (order) {
            // Generate Barcodes
            order.tests.forEach((test, index) => {
                try {
                    const barcodeValue = order.patientId.split(' - ')[0] || order.id;
                    JsBarcode(`#barcode-${index}`, barcodeValue, {
                        format: "CODE128",
                        width: 1.5,
                        height: 30,
                        displayValue: false,
                        margin: 0
                    });
                } catch (e) {
                    console.error("Barcode error", e);
                }
            });

            setTimeout(() => {
                window.print();
            }, 800);
        }
    }, [order]);

    if (!order) return <div className="p-8 text-center text-slate-500">Loading label data...</div>;

    const patientName = patient ? patient.fullName : (order.patientId ? order.patientId.split(' - ')[1] : 'Unknown');
    const patientId = patient ? patient.id : (order.patientId ? order.patientId.split(' - ')[0] : 'Unknown');
    const genderAge = patient ? `${patient.age}/${patient.gender.charAt(0).toUpperCase()}` : '';

    return (
        <div className="bg-white min-h-screen p-8 print:p-0">
            <div className="grid grid-cols-2 gap-4 print:block print:gap-0">
                {order.tests.map((test, index) => (
                    <div key={index} className="border border-slate-300 rounded-lg p-2 w-[50mm] h-[25mm] flex flex-col justify-between mb-4 print:mb-[2mm] print:break-inside-avoid page-break-inside-avoid overflow-hidden relative bg-white">

                        <div className="flex justify-between items-start">
                            <div className="max-w-[70%]">
                                <h3 className="text-[10px] font-bold text-slate-900 leading-tight truncate">{patientName}</h3>
                                <p className="text-[9px] text-slate-600 font-medium">{patientId} <span className="mx-0.5">|</span> {genderAge}</p>
                            </div>
                            <span className="text-[8px] font-bold bg-slate-100 px-1 rounded truncate max-w-[30%]">{test.code}</span>
                        </div>

                        <div className="flex justify-center items-center mt-1">
                            <canvas id={`barcode-${index}`}></canvas>
                        </div>

                        <div className="text-right mt-auto">
                            <p className="text-[7px] text-slate-400">{new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PrintLabel;

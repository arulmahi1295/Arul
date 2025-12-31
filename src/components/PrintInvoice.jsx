import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { storage } from '../data/storage';
import Letterhead from './Letterhead';

const PrintInvoice = () => {
    // ... (keep state logic same)
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [patient, setPatient] = useState(null);

    useEffect(() => {
        if (location.state && location.state.order) {
            setOrder(location.state.order);
            // Fetch full patient details if available
            if (location.state.order.patientId) {
                // Extract clean ID if it's in "ID - Name" format
                const rawId = location.state.order.patientId.split(' - ')[0];
                const patients = storage.getPatients();
                const foundPatient = patients.find(p => p.id === rawId);
                setPatient(foundPatient);
            }
        }
    }, [location.state]);

    useEffect(() => {
        if (order) {
            // Auto-print when data is ready
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [order]);

    if (!order) return <div className="p-8 text-center text-slate-500">Loading invoice data...</div>;

    const subtotal = order.subtotal || order.tests.reduce((acc, test) => acc + test.price, 0);
    const discount = order.discount || 0;
    const totalAmount = order.totalAmount || (subtotal - discount);

    return (
        <div className="bg-white min-h-screen p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none">
            <Letterhead
                title="INVOICE"
                subtitle={`#${order.id}`}
                meta={<>Date: {new Date(order.createdAt).toLocaleDateString()}</>}
            />

            {/* Patient Info */}
            <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100 print:bg-transparent print:border-slate-200">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Bill To</h3>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <p className="text-sm text-slate-400 mb-1">Patient Name</p>
                        <p className="font-bold text-slate-800 text-lg">{patient ? patient.fullName : order.patientId.split(' - ')[1] || 'Unknown'}</p>
                    </div>
                    <div>
                        <p className="text-sm text-slate-400 mb-1">Patient ID</p>
                        <p className="font-medium text-slate-800">{patient ? patient.id : order.patientId.split(' - ')[0]}</p>
                    </div>
                    {patient && (
                        <>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Age / Gender</p>
                                <p className="font-medium text-slate-800">{patient.age} Y / {patient.gender}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Contact</p>
                                <p className="font-medium text-slate-800">{patient.phone}</p>
                            </div>
                            {patient.address && (
                                <div className="col-span-2">
                                    <p className="text-sm text-slate-400 mb-1">Address</p>
                                    <p className="font-medium text-slate-800">{patient.address}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="py-3 text-sm font-bold text-slate-500 uppercase">#</th>
                            <th className="py-3 text-sm font-bold text-slate-500 uppercase">Test Description</th>
                            <th className="py-3 text-sm font-bold text-slate-500 uppercase">Code</th>
                            <th className="py-3 text-sm font-bold text-slate-500 uppercase text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {order.tests.map((test, index) => (
                            <tr key={index}>
                                <td className="py-4 text-slate-500">{index + 1}</td>
                                <td className="py-4 text-slate-800 font-medium">{test.name}</td>
                                <td className="py-4 text-slate-500 text-sm">{test.code}</td>
                                <td className="py-4 text-slate-800 font-bold text-right">₹{test.price}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200">
                            <td colSpan="3" className="py-2 text-right font-medium text-slate-500">Subtotal</td>
                            <td className="py-2 text-right font-medium text-slate-800">₹{subtotal}</td>
                        </tr>
                        {discount > 0 && (
                            <tr>
                                <td colSpan="3" className="py-2 text-right font-medium text-slate-500">Discount</td>
                                <td className="py-2 text-right font-medium text-rose-600">- ₹{discount}</td>
                            </tr>
                        )}
                        <tr className="border-t border-slate-800">
                            <td colSpan="3" className="py-4 text-right font-bold text-slate-800 text-lg">Total Payable</td>
                            <td className="py-4 text-right text-xl font-bold text-indigo-700">₹{totalAmount}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <footer className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-500">
                <p className="mb-2">Thank you for choosing LIMSPro Labs.</p>
                <p>This is a computer-generated invoice and does not require a signature.</p>
            </footer>
        </div>
    );
};

export default PrintInvoice;

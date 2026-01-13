import React, { useEffect, useState } from 'react';
import { Leaf } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { storage } from '../data/storage';
import Letterhead from './Letterhead';

const PrintInvoice = () => {
    // ... (keep state logic same)
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [patient, setPatient] = useState(null);
    const [headerImage, setHeaderImage] = useState(null);
    const [footerImage, setFooterImage] = useState(null);
    const [watermarkImage, setWatermarkImage] = useState(null);

    useEffect(() => {
        const loadInvoiceData = async () => {
            let printOrder = null;
            if (location.state && location.state.order) {
                printOrder = location.state.order;
            } else {
                // Fallback to session storage
                const stored = sessionStorage.getItem('print_invoice_data');
                if (stored) {
                    printOrder = JSON.parse(stored);
                }
            }

            if (printOrder) {
                setOrder(printOrder);
                // Fetch full patient details if available
                if (printOrder.patientId) {
                    // Extract clean ID if it's in "ID - Name" format
                    const rawId = printOrder.patientId.split(' - ')[0];
                    const patients = (await storage.getPatients()) || [];
                    const foundPatient = patients.find(p => p.id === rawId);
                    setPatient(foundPatient);
                }
            }

            // Load Settings
            const settings = await storage.getSettings();
            if (settings) {
                setHeaderImage(settings.headerImage || null);
                setFooterImage(settings.footerImage || null);
                setWatermarkImage(settings.watermarkImage || null);
            }
        };
        loadInvoiceData();
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
        <>
            <style>
                {`
                    @media print {
                        @page {
                            size: A5 portrait;
                            margin: 10mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            /* Optional: Scale down if content is too wide */
                            transform: scale(0.95);
                            transform-origin: top left;
                            width: 100%;
                        }
                    }
                `}
            </style>
            <div className="bg-white min-h-screen p-4 max-w-[148mm] mx-auto print:p-0 print:max-w-none print:w-[148mm] print:overflow-hidden relative overflow-hidden flex flex-col">

                {/* Watermark in Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {watermarkImage ? (
                        <img src={watermarkImage} alt="Watermark" className="w-[70%] opacity-[0.08] object-contain rotate-[-15deg]" />
                    ) : (
                        <Leaf className="w-80 h-80 text-emerald-600 opacity-[0.08] rotate-[-15deg]" />
                    )}
                </div>

                {/* Header Section */}
                <div className="z-10 relative shrink-0">
                    {headerImage ? (
                        <img src={headerImage} alt="Header" className="w-full mb-4 object-contain max-h-32" />
                    ) : (
                        <Letterhead
                            title="INVOICE"
                            subtitle={`#${order.id}`}
                            meta={<>Date: {new Date(order.createdAt).toLocaleDateString()}</>}
                        />
                    )}
                </div>

                {/* Patient Info */}
                <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100 print:bg-transparent print:border-slate-200 text-xs">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-200 pb-1">Bill To</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[10px] text-slate-400 mb-0.5">Patient Name</p>
                            <p className="font-bold text-slate-800 text-sm">{patient ? patient.fullName : order.patientId.split(' - ')[1] || 'Unknown'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-0.5">Patient ID</p>
                            <p className="font-medium text-slate-800 text-sm">{patient ? patient.id : order.patientId.split(' - ')[0]}</p>
                        </div>
                        {patient && (
                            <>
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Age / Gender</p>
                                    <p className="font-medium text-slate-800 text-xs">{patient.age} Y / {patient.gender}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-400 mb-0.5">Contact</p>
                                    <p className="font-medium text-slate-800 text-xs">{patient.phone}</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Line Items */}
                <div className="mb-6">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase w-8">#</th>
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase">Test</th>
                                <th className="py-2 text-[10px] font-bold text-slate-500 uppercase text-right">Amt</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.tests.map((test, index) => (
                                <tr key={index}>
                                    <td className="py-2 text-slate-500 text-xs">{index + 1}</td>
                                    <td className="py-2 text-slate-800 font-medium text-xs">
                                        {test.name}
                                        <div className="text-[10px] text-slate-400">{test.code}</div>
                                    </td>
                                    <td className="py-2 text-slate-800 font-bold text-xs text-right">₹{test.price}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-slate-200">
                                <td colSpan="2" className="py-1.5 text-right font-medium text-slate-500 text-xs">Subtotal</td>
                                <td className="py-1.5 text-right font-medium text-slate-800 text-xs">₹{subtotal}</td>
                            </tr>
                            {discount > 0 && (
                                <tr>
                                    <td colSpan="2" className="py-1.5 text-right font-medium text-slate-500 text-xs">Discount</td>
                                    <td className="py-1.5 text-right font-medium text-rose-600 text-xs">- ₹{discount}</td>
                                </tr>
                            )}
                            <tr className="border-t border-slate-800">
                                <td colSpan="2" className="py-2 text-right font-bold text-slate-800 text-sm">Total Amount</td>
                                <td className="py-2 text-right text-sm font-bold text-slate-800">₹{totalAmount}</td>
                            </tr>
                            {(order.advancePaid > 0 || order.balanceDue > 0) && (
                                <>
                                    <tr>
                                        <td colSpan="2" className="py-1.5 text-right font-medium text-slate-500 text-xs">Advance Paid</td>
                                        <td className="py-1.5 text-right font-medium text-emerald-600 text-xs">₹{order.advancePaid || 0}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan="2" className="py-1.5 text-right font-bold text-slate-700 text-xs">Balance Due</td>
                                        <td className="py-1.5 text-right font-bold text-rose-600 text-xs">₹{order.balanceDue || 0}</td>
                                    </tr>
                                </>
                            )}
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <footer className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 z-10 relative shrink-0">
                    <p className="mb-1">Thank you for choosing GreenHealth Lab.</p>
                    {footerImage && (
                        <img src={footerImage} alt="Footer" className="w-full mt-2 object-contain max-h-24" />
                    )}
                </footer>
            </div>
        </>
    );
};

export default PrintInvoice;

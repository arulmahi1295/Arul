import React, { useEffect, useState } from 'react';
import { Leaf, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { storage } from '../data/storage';
import Letterhead from './Letterhead';

const PrintInvoice = () => {
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
                const stored = sessionStorage.getItem('print_invoice_data');
                if (stored) {
                    printOrder = JSON.parse(stored);
                }
            }

            if (printOrder) {
                setOrder(printOrder);
                if (printOrder.patientId) {
                    const rawId = printOrder.patientId.split(' - ')[0];
                    const patients = (await storage.getPatients()) || [];
                    const foundPatient = patients.find(p => p.id === rawId);
                    setPatient(foundPatient);
                }
            }

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
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [order]);

    if (!order) return <div className="p-8 text-center text-slate-500">Loading invoice data...</div>;

    const subtotal = order.subtotal || order.tests.reduce((acc, test) => acc + test.price, 0);
    const discount = order.discount || 0;
    const totalAmount = order.totalAmount || (subtotal - discount);
    const isPaid = order.paymentStatus === 'Paid' || (order.balanceDue === 0 && order.advancePaid > 0);

    // QR Code data
    const qrData = JSON.stringify({
        invoiceId: order.id,
        patientId: patient?.id || order.patientId.split(' - ')[0],
        amount: totalAmount,
        date: order.createdAt
    });

    return (
        <>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                    @media print {
                        @page {
                            size: A5 portrait;
                            margin: 8mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: 'Inter', sans-serif;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                    
                    * {
                        font-family: 'Inter', sans-serif;
                    }
                `}
            </style>
            <div className="bg-white min-h-screen p-6 max-w-[148mm] mx-auto print:p-0 print:max-w-none print:w-[148mm] relative overflow-hidden">

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {watermarkImage ? (
                        <img src={watermarkImage} alt="Watermark" className="w-[60%] opacity-[0.04] object-contain rotate-[-15deg]" />
                    ) : (
                        <Leaf className="w-72 h-72 text-emerald-600 opacity-[0.04] rotate-[-15deg]" />
                    )}
                </div>

                {/* Header */}
                <div className="z-10 relative mb-6">
                    {headerImage ? (
                        <img src={headerImage} alt="Header" className="w-full mb-4 object-contain max-h-28" />
                    ) : (
                        <Letterhead
                            title="TAX INVOICE"
                            subtitle={`#${order.id}`}
                            meta={<>
                                <div className="flex items-center gap-2 text-xs">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </>}
                        />
                    )}
                </div>

                {/* Status Badge */}
                <div className="flex justify-end items-start mb-6 z-10 relative">
                    <div className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold ${isPaid
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                        {isPaid ? (
                            <>
                                <CheckCircle2 className="h-4 w-4" />
                                PAID
                            </>
                        ) : (
                            <>
                                <Clock className="h-4 w-4" />
                                PENDING
                            </>
                        )}
                    </div>
                </div>

                {/* Patient & Billing Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6 z-10 relative">
                    {/* Bill To */}
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-4 border border-slate-200">
                        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <div className="h-1 w-1 rounded-full bg-indigo-500"></div>
                            Bill To
                        </h3>
                        <div className="space-y-2">
                            <div>
                                <p className="text-[9px] text-slate-400 mb-0.5">Patient Name</p>
                                <p className="font-bold text-slate-800 text-sm leading-tight">
                                    {patient ? patient.fullName : order.patientId.split(' - ')[1] || 'Unknown'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[9px] text-slate-400 mb-0.5">ID</p>
                                    <p className="font-semibold text-slate-700 text-[10px]">
                                        {patient ? patient.id : order.patientId.split(' - ')[0]}
                                    </p>
                                </div>
                                {patient && (
                                    <div>
                                        <p className="text-[9px] text-slate-400 mb-0.5">Age/Gender</p>
                                        <p className="font-semibold text-slate-700 text-[10px]">
                                            {patient.age}Y / {patient.gender?.charAt(0)}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {patient?.phone && (
                                <div>
                                    <p className="text-[9px] text-slate-400 mb-0.5">Contact</p>
                                    <p className="font-medium text-slate-700 text-[10px]">{patient.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sample & Payment Info */}
                    <div className="space-y-3">
                        {/* Sample Info */}
                        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 rounded-xl p-3 border border-indigo-200">
                            <h4 className="text-[9px] font-bold text-indigo-700 uppercase tracking-wider mb-2">Sample Details</h4>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-indigo-600">Collection</span>
                                    <span className="text-[9px] font-semibold text-indigo-900">
                                        {order.collectedAt
                                            ? new Date(order.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                            : new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                        }
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-indigo-600">Expected Report</span>
                                    <span className="text-[9px] font-semibold text-indigo-900">
                                        {new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Info */}
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-xl p-3 border border-emerald-200">
                            <h4 className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider mb-2">Payment</h4>
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] text-emerald-600">Mode</span>
                                    <span className="text-[9px] font-semibold text-emerald-900">
                                        {order.paymentMode || 'Cash'}
                                    </span>
                                </div>
                                {order.transactionRef && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] text-emerald-600">Ref</span>
                                        <span className="text-[9px] font-mono font-semibold text-emerald-900">
                                            {order.transactionRef}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div className="mb-6 z-10 relative">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b-2 border-slate-300">
                                <th className="py-2 text-[9px] font-bold text-slate-600 uppercase tracking-wider text-left w-8">#</th>
                                <th className="py-2 text-[9px] font-bold text-slate-600 uppercase tracking-wider text-left">Test Description</th>
                                <th className="py-2 text-[9px] font-bold text-slate-600 uppercase tracking-wider text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {order.tests.map((test, index) => (
                                <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="py-2.5 text-slate-500 text-[10px] font-medium">{index + 1}</td>
                                    <td className="py-2.5">
                                        <div className="text-slate-800 font-semibold text-[11px] leading-tight">{test.name}</div>
                                        {test.code && <div className="text-[9px] text-slate-400 mt-0.5">Code: {test.code}</div>}
                                    </td>
                                    <td className="py-2.5 text-slate-800 font-bold text-[11px] text-right tabular-nums">₹{test.price.toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-t border-slate-200">
                                <td colSpan="2" className="py-2 text-right font-semibold text-slate-600 text-[10px]">Subtotal</td>
                                <td className="py-2 text-right font-semibold text-slate-800 text-[10px] tabular-nums">₹{subtotal.toLocaleString('en-IN')}</td>
                            </tr>
                            {discount > 0 && (
                                <tr>
                                    <td colSpan="2" className="py-1.5 text-right font-semibold text-slate-600 text-[10px]">Discount</td>
                                    <td className="py-1.5 text-right font-semibold text-rose-600 text-[10px] tabular-nums">- ₹{discount.toLocaleString('en-IN')}</td>
                                </tr>
                            )}
                            <tr className="border-t-2 border-slate-800">
                                <td colSpan="2" className="py-2.5 text-right font-bold text-slate-900 text-sm">Total Amount</td>
                                <td className="py-2.5 text-right text-base font-bold text-slate-900 tabular-nums">₹{totalAmount.toLocaleString('en-IN')}</td>
                            </tr>
                            {(order.advancePaid > 0 || order.balanceDue > 0) && (
                                <>
                                    <tr className="bg-emerald-50/50">
                                        <td colSpan="2" className="py-2 text-right font-semibold text-emerald-700 text-[10px]">Amount Paid</td>
                                        <td className="py-2 text-right font-bold text-emerald-700 text-[11px] tabular-nums">₹{(order.advancePaid || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr className="bg-amber-50/50 border-t border-amber-200">
                                        <td colSpan="2" className="py-2 text-right font-bold text-amber-800 text-[11px]">Balance Due</td>
                                        <td className="py-2 text-right font-bold text-amber-800 text-sm tabular-nums">₹{(order.balanceDue || 0).toLocaleString('en-IN')}</td>
                                    </tr>
                                </>
                            )}
                        </tfoot>
                    </table>
                </div>

                {/* Footer */}
                <footer className="mt-8 pt-4 border-t-2 border-slate-200 z-10 relative">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                            <h4 className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Terms & Conditions</h4>
                            <ul className="text-[8px] text-slate-500 space-y-0.5 leading-tight">
                                <li>• Reports will be available within 24-48 hours</li>
                                <li>• Sample recollection may be required if inadequate</li>
                                <li>• Balance payment due before report release</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Contact Us</h4>
                            <div className="text-[8px] text-slate-500 space-y-0.5 leading-tight">
                                <p>📞 +91 98765 43210</p>
                                <p>📧 info@greenhealth.lab</p>
                                <p>🌐 www.greenhealth.lab</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-[9px] text-slate-400 mt-3 pt-3 border-t border-slate-100">
                        <p className="font-medium">Thank you for choosing GreenHealth Lab</p>
                        <p className="text-[8px] mt-1">This is a computer-generated invoice and does not require a signature</p>
                    </div>

                    {footerImage && (
                        <img src={footerImage} alt="Footer" className="w-full mt-3 object-contain max-h-20" />
                    )}
                </footer>
            </div>
        </>
    );
};

export default PrintInvoice;

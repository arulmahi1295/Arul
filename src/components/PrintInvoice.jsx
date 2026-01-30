import React, { useEffect, useState } from 'react';
import { Leaf, CheckCircle2, Clock, Calendar, MapPin, Phone } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { storage } from '../data/storage';
import Letterhead from './Letterhead';

const PrintInvoice = () => {
    const location = useLocation();
    const [order, setOrder] = useState(null);
    const [patient, setPatient] = useState(null);
    const [headerImage, setHeaderImage] = useState(null);
    const [footerImage, setFooterImage] = useState(null);
    const [labSeal, setLabSeal] = useState(null);
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
                setLabSeal(settings.labSeal || null);
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

    // Recalculate totals for display to ensure consistency
    const subtotal = order.subtotal || order.tests.reduce((acc, test) => acc + test.price, 0);
    const homeCollectionAmount = order.homeCollectionCharges || 0;
    const discount = order.discount || 0;
    const totalAmount = Math.max(0, subtotal + homeCollectionAmount - discount);

    // Payment Status Logic
    const isPaid = order.paymentStatus === 'Paid' || (order.balanceDue === 0 && order.advancePaid > 0);

    // QR Code data
    const qrData = JSON.stringify({
        invoiceId: order.id,
        patientId: patient?.id || order.patientId.split(' - ')[0],
        amount: totalAmount,
        date: order.createdAt
    });

    return (
        <div className="w-[210mm] min-h-[297mm] bg-white p-8 mx-auto font-sans text-slate-900 relative">
            {/* Top decorative bar */}
            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-600"></div>

            {/* Header Section */}
            <header className="flex justify-between items-start mb-12 mt-4">
                {/* Left: Lab Defaults */}
                <div className="w-1/2">
                    <div className="flex items-center gap-3 mb-4">
                        <Leaf className="h-10 w-10 text-emerald-600" />
                        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">GreenHealth<span className="text-emerald-600">Lab</span></h1>
                    </div>
                    <div className="text-sm text-slate-500 space-y-1.5 leading-relaxed pl-1">
                        <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-500" /> 37/A 15th Cross 16th Main Road BTM 2nd Stage Bengaluru 560076</p>
                        <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-500" /> +91 83100 22139</p>
                        <p className="flex items-center gap-2"><span className="font-semibold text-emerald-600">www.greenhealthlab.com</span></p>
                    </div>
                </div>

                {/* Right: Invoice Meta */}
                <div className="w-1/2 text-right">
                    <h2 className="text-5xl font-black text-slate-100 uppercase tracking-widest absolute right-8 top-12 -z-10 select-none">
                        {order.isEstimate ? "ESTIMATE" : "INVOICE"}
                    </h2>
                    <div className="inline-block text-right bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            {order.isEstimate ? "Estimate Ref" : "Invoice No"}
                        </p>
                        <p className="text-xl font-bold text-slate-900 mb-3 font-mono">{order.id}</p>

                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </p>
                    </div>
                </div>
            </header>

            {/* Client Info Section */}
            <section className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-10 flex gap-8">
                <div className="flex-1">
                    <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-emerald-500 rounded-full"></span>
                        Client Details
                    </h3>
                    <div className="space-y-1">
                        <p className="text-lg font-bold text-slate-900">{patient ? patient.fullName : (order.patientName || 'Unknown')}</p>
                        <p className="text-sm text-slate-500 font-medium">ID: {patient ? patient.id : (order.patientId?.split(' - ')[0] || '-')}</p>
                        {patient && (
                            <p className="text-sm text-slate-500">
                                {patient.age} Yrs / {patient.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : '-'}
                            </p>
                        )}
                        {patient?.phone && <p className="text-sm text-slate-500 pt-1">{patient.phone}</p>}
                    </div>
                </div>

                {/* Order Details Grid */}
                <div className="flex-1 border-l border-slate-200 pl-8 grid grid-cols-2 gap-y-4 gap-x-2 content-start">
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Collection Date</p>
                        <p className="text-sm font-semibold text-slate-700">
                            {order.collectedAt
                                ? new Date(order.collectedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                                : new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                            }
                        </p>
                    </div>
                    {!order.isEstimate && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Report Due</p>
                            <p className="text-sm font-semibold text-slate-700">
                                {new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                        </div>
                    )}
                    {!order.isEstimate && (
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Payment Mode</p>
                            <p className="text-sm font-semibold text-slate-700">{order.paymentMode || 'Cash'}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Line Items Table */}
            <div className="mb-8">
                <table className="w-full">
                    <thead>
                        <tr className="border-b-2 border-slate-900">
                            <th className="py-3 text-xs font-bold text-slate-900 uppercase tracking-wider text-left w-12">#</th>
                            <th className="py-3 text-xs font-bold text-slate-900 uppercase tracking-wider text-left">Description</th>
                            <th className="py-3 text-xs font-bold text-slate-900 uppercase tracking-wider text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {order.tests.map((test, index) => (
                            <tr key={index}>
                                <td className="py-4 text-sm font-semibold text-slate-500 align-top">{index + 1}</td>
                                <td className="py-4 align-top">
                                    <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                        {test.name}
                                        {test.type === 'package' && <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 rounded">PKG</span>}
                                    </p>

                                    {/* Package Contents */}
                                    {test.type === 'package' && test.tests && (
                                        <div className="mt-2 pl-3 border-l-2 border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Includes</p>
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                {test.tests.map((t, i) => (
                                                    <p key={i} className="text-[10px] text-slate-500 font-medium">• {t.name}</p>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="py-4 text-sm font-bold text-slate-800 text-right tabular-nums align-top">
                                    ₹{test.price.toLocaleString('en-IN')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end mb-16">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between items-center text-sm font-medium text-slate-500">
                        <span>Subtotal</span>
                        <span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    {homeCollectionAmount > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                            <span>Home Collection</span>
                            <span>₹{homeCollectionAmount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    {discount > 0 && (
                        <div className="flex justify-between items-center text-sm font-medium text-rose-600">
                            <span>Discount</span>
                            <span>- ₹{discount.toLocaleString('en-IN')}</span>
                        </div>
                    )}
                    <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center">
                        <span className="text-base font-bold text-slate-900">Total</span>
                        <span className="text-2xl font-black text-slate-900">₹{totalAmount.toLocaleString('en-IN')}</span>
                    </div>

                    {!order.isEstimate && (
                        <div className="pt-2">
                            {isPaid ? (
                                <div className="bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider text-center py-2 rounded border border-emerald-100">
                                    Paid in Full
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-semibold text-emerald-700">
                                        <span>Paid</span>
                                        <span>₹{(order.advancePaid || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold text-amber-700 pt-2 border-t border-dashed border-amber-200">
                                        <span>Balance Due</span>
                                        <span>₹{(order.balanceDue || 0).toLocaleString('en-IN')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <footer className="absolute bottom-0 left-0 w-full p-8 border-t border-slate-100 flex justify-between items-end">
                <div className="text-xs text-slate-400 max-w-md">
                    <h4 className="font-bold text-slate-700 uppercase mb-1">Terms & Conditions</h4>
                    <p>{order.isEstimate ? "This estimate is valid for 7 days. Final pricing subject to change." : "Reports will be released only after full payment."}</p>
                    <p className="mt-1">In case of any discrepancy, please contact administration within 24 hours.</p>
                </div>
                <div className="text-right">
                    {!order.isEstimate && <div className="mb-4 relative w-32 ml-auto">
                        {/* Signature placeholder */}
                        <div className="h-12 border-b-2 border-slate-300 w-full"></div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-center">Authorized Signatory</p>
                    </div>}
                    <p className="text-[10px] text-slate-300">Generated by GreenHealth LIS</p>
                </div>
            </footer>
        </div>
    );
};

export default PrintInvoice;

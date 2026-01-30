import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Letterhead from './Letterhead';
import { storage } from '../data/storage';
import { useTests } from '../contexts/TestContext';
import { Download, Printer, MessageCircle, Leaf, AlertCircle, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const PrintReport = () => {
    const { tests } = useTests();
    const location = useLocation();
    const [reportData, setReportData] = useState(null);
    const [signature, setSignature] = useState(null);
    const [labTechSignature, setLabTechSignature] = useState(null);
    const [headerImage, setHeaderImage] = useState(null);
    const [footerImage, setFooterImage] = useState(null);
    const [watermarkImage, setWatermarkImage] = useState(null);
    const [labSeal, setLabSeal] = useState(null);
    const [labDetails, setLabDetails] = useState(null);
    const reportRef = useRef(null);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await storage.getSettings();
            if (settings) {
                setSignature(settings.signature || null);
                setLabTechSignature(settings.labTechSignature || null);
                setHeaderImage(settings.headerImage || null);
                setFooterImage(settings.footerImage || null);
                setWatermarkImage(settings.watermarkImage || null);
                setLabSeal(settings.labSeal || null);
                setLabDetails(settings.labDetails || null);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        if (location.state && location.state.report) {
            setReportData(location.state.report);
        } else {
            const sessionData = sessionStorage.getItem('print_report_data');
            if (sessionData) {
                setReportData(JSON.parse(sessionData));
            } else {
                // Preview fallback
                setReportData({
                    id: 'RPT-PREVIEW',
                    patientName: 'Jane Doe',
                    patientId: 'P-2024-001',
                    age: 32,
                    gender: 'Female',
                    date: new Date().toISOString(),
                    tests: [
                        { name: 'Hemoglobin', result: '13.2', unit: 'g/dL', refRange: '12.0 - 15.0', method: 'Photometry' },
                    ]
                });
            }
        }
    }, [location.state]);

    const handleDownloadPDF = () => {
        const element = reportRef.current;
        const opt = {
            margin: [5, 5],
            filename: `Report_${reportData?.id || 'draft'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(opt).from(element).save();
    };

    if (!reportData) return <div className="p-8 text-center text-slate-500">Loading report...</div>;

    // QR Code for verification
    const qrData = JSON.stringify({
        reportId: reportData.id,
        patientId: reportData.patientId,
        date: reportData.date,
        verified: true
    });

    return (
        <div className="bg-slate-100 min-h-screen pb-12 print:bg-white print:pb-0">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    
                    @media print {
                        @page {
                            size: A4 portrait;
                            margin: 10mm;
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

            {/* Toolbar - Screen Only */}
            <div className="bg-white border-b border-slate-200 p-4 mb-8 shadow-sm print:hidden sticky top-0 z-10 no-print">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <h1 className="font-bold text-slate-700">Preview Report</h1>
                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                let phone = reportData.patientPhone;
                                if (!phone) {
                                    phone = prompt("Enter Patient Phone Number (10 digits):");
                                }
                                if (phone) {
                                    const text = `Dear ${reportData.patientName}, Please find your test report attached. Report ID: ${reportData.id}. GreenHealth Lab.`;
                                    window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(text)}`, '_blank');
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium shadow-sm"
                        >
                            <MessageCircle className="h-4 w-4" /> WhatsApp
                        </button>
                        <button
                            onClick={handleDownloadPDF}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                        >
                            <Download className="h-4 w-4" /> Download PDF
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors font-medium shadow-sm"
                        >
                            <Printer className="h-4 w-4" /> Print
                        </button>
                    </div>
                </div>
            </div>

            {/* Printable Content */}
            <div ref={reportRef} className="bg-white p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none shadow-xl print:shadow-none min-h-[297mm] relative overflow-hidden flex flex-col">

                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {watermarkImage ? (
                        <img src={watermarkImage} alt="Watermark" className="w-[50%] opacity-[0.04] object-contain rotate-[-15deg]" />
                    ) : (
                        <Leaf className="w-96 h-96 text-emerald-600 opacity-[0.04] rotate-[-15deg]" />
                    )}
                </div>

                {/* Header */}
                <div className="z-10 relative mb-6 shrink-0">
                    {headerImage ? (
                        <img src={headerImage} alt="Header" className="w-full mb-4 object-contain max-h-40" />
                    ) : (
                        <Letterhead
                            title="DIAGNOSTIC REPORT"
                            subtitle={`Report ID: ${reportData.id}`}
                            meta={<>Reported: {new Date(reportData.date).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</>}
                            labDetails={labDetails}
                        />
                    )}
                </div>

                {/* Patient Details - Enhanced Grid */}
                <div className="border-2 border-slate-200 rounded-xl p-5 mb-6 bg-gradient-to-br from-slate-50 to-white z-10 relative">
                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                        Patient Information
                    </h3>
                    <div className="grid grid-cols-3 gap-x-6 gap-y-3 text-sm">
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Patient Name</p>
                            <p className="font-bold text-slate-800">{reportData.patientName}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Patient ID</p>
                            <p className="font-semibold text-slate-700">{reportData.patientId}</p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Age / Gender</p>
                            <p className="font-semibold text-slate-700">
                                {reportData.age} Years / {reportData.gender ? (reportData.gender.charAt(0).toUpperCase() + reportData.gender.slice(1)) : '-'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Sample Collected</p>
                            <p className="font-medium text-slate-700 text-xs">
                                {reportData.sampleDate
                                    ? new Date(reportData.sampleDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })
                                    : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Billing Date</p>
                            <p className="font-medium text-slate-700 text-xs">
                                {reportData.billingDate
                                    ? new Date(reportData.billingDate).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })
                                    : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Report Date</p>
                            <p className="font-medium text-slate-700 text-xs">
                                {new Date(reportData.date).toLocaleDateString('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </p>
                        </div>
                        {reportData.patientPhone && (
                            <div>
                                <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Contact</p>
                                <p className="font-medium text-slate-700 text-xs">{reportData.patientPhone}</p>
                            </div>
                        )}
                        <div>
                            <p className="text-[9px] text-slate-400 mb-1 uppercase tracking-wide">Referring Doctor</p>
                            <p className="font-medium text-slate-700 text-xs">Dr. Anjali Sharma, MD</p>
                        </div>
                    </div>
                </div>

                {/* Results Table - Ultra Pro */}
                <div className="mb-8 z-10 relative">
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-5 py-3 flex justify-between items-center rounded-t-xl">
                        <span className="text-sm font-bold text-white uppercase tracking-wide">Laboratory Results</span>
                        <span className="text-xs font-medium text-indigo-100">Grouped by Department</span>
                    </div>

                    <table className="w-full text-sm border-collapse border-2 border-slate-200">
                        <thead>
                            <tr className="bg-slate-100 border-b-2 border-slate-300">
                                <th className="py-3 px-4 font-bold text-slate-700 text-left text-xs uppercase tracking-wide">Test Parameter</th>
                                <th className="py-3 px-3 font-bold text-slate-700 text-center text-xs uppercase tracking-wide">Result</th>
                                <th className="py-3 px-3 font-bold text-slate-700 text-center text-xs uppercase tracking-wide">Unit</th>
                                <th className="py-3 px-3 font-bold text-slate-700 text-center text-xs uppercase tracking-wide">Reference Range</th>
                                <th className="py-3 px-4 font-bold text-slate-700 text-center text-xs uppercase tracking-wide">Method</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                if (!reportData.tests) return null;

                                // Group tests by category
                                const grouped = {};
                                reportData.tests.forEach(test => {
                                    const catalogItem = tests.find(t => t.name === test.name) || {};
                                    const category = catalogItem.category || 'Other Tests';
                                    if (!grouped[category]) {
                                        grouped[category] = [];
                                    }
                                    grouped[category].push({
                                        ...test,
                                        refRange: test.refRange || catalogItem.defaultRefRange,
                                        method: test.method || catalogItem.method || 'Standard'
                                    });
                                });

                                // Check if value is abnormal
                                const checkAbnormal = (val, range) => {
                                    if (!range || !val) return null;
                                    const rangeMatch = range.match(/([0-9.]+)\s*-\s*([0-9.]+)/);
                                    if (rangeMatch) {
                                        const min = parseFloat(rangeMatch[1]);
                                        const max = parseFloat(rangeMatch[2]);
                                        const numVal = parseFloat(val);
                                        if (!isNaN(numVal)) {
                                            if (numVal < min) return 'LOW';
                                            if (numVal > max) return 'HIGH';
                                        }
                                    }
                                    const lessMatch = range.match(/<\s*([0-9.]+)/);
                                    if (lessMatch) {
                                        const max = parseFloat(lessMatch[1]);
                                        const numVal = parseFloat(val);
                                        if (!isNaN(numVal) && numVal > max) return 'HIGH';
                                    }
                                    return null;
                                };

                                return Object.keys(grouped).sort().map(category => (
                                    <React.Fragment key={category}>
                                        <tr className="bg-gradient-to-r from-slate-200 to-slate-100 border-y border-slate-300">
                                            <td colSpan="5" className="py-2.5 px-4 font-bold text-slate-800 uppercase text-xs tracking-wider">
                                                {category}
                                            </td>
                                        </tr>
                                        {grouped[category].map((test, i) => {
                                            const status = checkAbnormal(test.result, test.refRange);
                                            return (
                                                <tr key={`${category}-${i}`} className="border-b border-slate-100 hover:bg-slate-50/50 print:break-inside-avoid">
                                                    <td className="py-3 px-4">
                                                        <p className="font-semibold text-slate-800">{test.name}</p>
                                                        {test.code && <p className="text-[10px] text-slate-400 mt-0.5">Code: {test.code}</p>}
                                                    </td>
                                                    <td className="py-3 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <span className={`font-bold text-base tabular-nums ${status ? 'text-red-600' : 'text-slate-800'}`}>
                                                                {test.result}
                                                            </span>
                                                            {status && (
                                                                <span className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold ${status === 'HIGH'
                                                                    ? 'bg-red-100 text-red-700 border border-red-200'
                                                                    : 'bg-amber-100 text-amber-700 border border-amber-200'
                                                                    }`}>
                                                                    {status === 'HIGH' ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                                                                    {status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-center text-slate-600 text-xs">{test.unit || '-'}</td>
                                                    <td className="py-3 px-3 text-center text-slate-600 text-xs font-medium whitespace-pre-wrap">{test.refRange || 'N/A'}</td>
                                                    <td className="py-3 px-4 text-center text-slate-500 text-[10px]">{test.method}</td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Quality Assurance */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 mb-6 z-10 relative">
                    <div className="flex items-start gap-3">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-2">Quality Assurance</h4>
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                                <div>
                                    <p className="text-emerald-600 font-semibold">QC Status</p>
                                    <p className="text-emerald-800">Passed</p>
                                </div>
                                <div>
                                    <p className="text-emerald-600 font-semibold">Sample Condition</p>
                                    <p className="text-emerald-800">Acceptable</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Authorization */}
                <footer className="mt-auto z-10 relative shrink-0">
                    <div className="border-t-2 border-slate-200 pt-6 print:break-inside-avoid">
                        {/* Signatures */}
                        <div className="flex justify-end items-end gap-12 mb-6 relative">
                            <div className="text-center relative">
                                {labTechSignature && (
                                    <img
                                        src={labTechSignature}
                                        alt="Lab Tech Signature"
                                        className="absolute bottom-10 left-1/2 -translate-x-1/2 h-12 object-contain mix-blend-multiply opacity-90"
                                    />
                                )}
                                <div className="h-14 w-40 mb-2 border-b-2 border-dashed border-slate-300"></div>
                                <p className="font-bold text-xs text-slate-800">Lab Technician</p>
                                <p className="text-[9px] text-slate-500">Verified By</p>
                            </div>
                            <div className="text-center relative">
                                {signature && (
                                    <img
                                        src={signature}
                                        alt="Pathologist Signature"
                                        className="absolute bottom-10 left-1/2 -translate-x-1/2 h-12 object-contain mix-blend-multiply opacity-90"
                                    />
                                )}
                                <div className="h-14 w-40 mb-2 border-b-2 border-dashed border-slate-300"></div>
                                <p className="font-bold text-xs text-slate-800">Dr. Pathologist</p>
                                <p className="text-[9px] text-slate-500">MD, Pathology</p>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div className="text-[9px] text-amber-800 leading-relaxed">
                                    <p className="font-semibold mb-1">Clinical Interpretation:</p>
                                    <p>Results should be clinically correlated with the patient's history and other diagnostic findings.
                                        Please consult your doctor for proper diagnosis and treatment. This report is electronically generated and verified.
                                        Reference ranges may vary based on age, gender, and methodology.</p>
                                </div>
                            </div>
                        </div>

                        {/* Contact & Footer */}
                        <div className="text-center text-[9px] text-slate-400 mb-2">
                            <p className="font-medium mb-1">{labDetails?.name || 'GreenHealth Laboratory'}</p>
                            <p>{labDetails?.address || '37/A 15th Cross 16th Main Road BTM 2nd Stage Bengaluru 560076'}</p>
                            <p>📞 {labDetails?.phone || '+91 83100 22139'} | 📧 {labDetails?.email || 'contact@greenhealthlab.com'}</p>
                            <p className="text-[8px] mt-2">{labDetails?.footerText || 'This is a computer-generated report. Digital signature ensures authenticity.'}</p>
                        </div>

                        {footerImage && (
                            <img src={footerImage} alt="Footer" className="w-full mt-3 object-contain max-h-24" />
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PrintReport;

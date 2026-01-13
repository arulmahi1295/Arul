import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Letterhead from './Letterhead';
import { storage } from '../data/storage';
import { TEST_CATALOG } from '../data/testCatalog';
import { Download, Printer, MessageCircle, Leaf } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const PrintReport = () => {
    const location = useLocation();
    const [reportData, setReportData] = useState(null);
    const [signature, setSignature] = useState(null);
    const [labTechSignature, setLabTechSignature] = useState(null);
    const [headerImage, setHeaderImage] = useState(null);
    const [footerImage, setFooterImage] = useState(null);
    const [watermarkImage, setWatermarkImage] = useState(null);
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
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        // Check location state first
        if (location.state && location.state.report) {
            setReportData(location.state.report);
        } else {
            // Check session storage (for new tab support)
            const sessionData = sessionStorage.getItem('print_report_data');
            if (sessionData) {
                setReportData(JSON.parse(sessionData));
                // Optional: clear it? sessionStorage.removeItem('print_report_data'); 
                // Better not clear in case reload needed.
            } else {
                // Fallback mock data for preview if accessed directly
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

    useEffect(() => {
        if (reportData && location.state) {
            // Only auto-print if likely triggered from app, not dev preview
            // setTimeout(() => {
            //     window.print();
            // }, 500);
        }
    }, [reportData]);

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

    return (
        <div className="bg-slate-100 min-h-screen pb-12 print:bg-white print:pb-0">
            {/* Toolbar - Screen Only */}
            <div className="bg-white border-b border-slate-200 p-4 mb-8 shadow-sm print:hidden sticky top-0 z-10">
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
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium shadow-sm mr-2"
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
            <div ref={reportRef} className="bg-white p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none font-sans text-slate-800 shadow-xl print:shadow-none min-h-[297mm] relative overflow-hidden flex flex-col">

                {/* Watermark in Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    {watermarkImage ? (
                        <img src={watermarkImage} alt="Watermark" className="w-[60%] opacity-[0.08] object-contain rotate-[-15deg]" />
                    ) : (
                        <Leaf className="w-96 h-96 text-emerald-600 opacity-[0.08] rotate-[-15deg]" />
                    )}
                </div>

                {/* Header Section */}
                <div className="z-10 relative shrink-0">
                    {headerImage ? (
                        <img src={headerImage} alt="Header" className="w-full mb-4 object-contain max-h-48" />
                    ) : (
                        <Letterhead
                            title="DIAGNOSTIC REPORT"
                            subtitle={`Report ID: ${reportData.id}`}
                            meta={<>Reported: {new Date(reportData.date).toLocaleString()}</>}
                        />
                    )}
                </div>

                {/* Patient Details */}
                <div className="border border-slate-200 rounded-lg p-4 mb-8 bg-slate-50 print:bg-transparent print:border-slate-300">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Patient:</span>
                            <span className="font-bold">{reportData.patientName}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Billing Date:</span>
                            <span className="font-semibold">{reportData.billingDate ? new Date(reportData.billingDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Age/Gender:</span>
                            <span>{reportData.age} Y / {reportData.gender}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Sample Date:</span>
                            <span className="font-semibold">{reportData.sampleDate ? new Date(reportData.sampleDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Patient ID:</span>
                            <span className="font-semibold">{reportData.patientId}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Reported Date:</span>
                            <span className="font-semibold">{reportData.date ? new Date(reportData.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '-'}</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Ref. Doc:</span>
                            <span>Dr. Anjali Sharma, MD</span>
                        </div>
                        <div className="flex">
                            <span className="w-28 text-slate-500 font-medium">Printed Date:</span>
                            <span>{new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                    </div>
                </div>

                {/* Results Table */}
                <div className="mb-12">
                    <div className="bg-white border-b-2 border-slate-200 px-4 py-2 flex justify-between items-center text-sm font-bold text-slate-800">
                        <span>TEST RESULTS</span>
                        <span className="text-xs font-normal text-slate-400">Grouped by Department</span>
                    </div>
                    <table className="w-full text-sm text-left border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="py-2 pl-4 font-semibold text-slate-600">Test Name</th>
                                <th className="py-2 font-semibold text-slate-600">Result</th>
                                <th className="py-2 font-semibold text-slate-600">Units</th>
                                <th className="py-2 pr-4 font-semibold text-slate-600 text-right">Reference Range</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">

                            {/* Group tests by category */}
                            {(() => {
                                if (!reportData.tests) return null;

                                // 1. Grouping
                                const grouped = {};
                                reportData.tests.forEach(test => {
                                    // Find full test details in catalog to get category
                                    const catalogItem = TEST_CATALOG.find(t => t.name === test.name) || {};
                                    const category = catalogItem.category || 'Other Tests';

                                    if (!grouped[category]) {
                                        grouped[category] = [];
                                    }
                                    grouped[category].push({ ...test, refRange: test.refRange || catalogItem.defaultRefRange });
                                });

                                // 2. Rendering
                                return Object.keys(grouped).sort().map(category => (
                                    <React.Fragment key={category}>
                                        <tr className="bg-slate-100/50 print:bg-slate-200">
                                            <td colSpan="4" className="py-2 pl-4 font-bold text-slate-800 uppercase text-xs tracking-wider">
                                                {category}
                                            </td>
                                        </tr>
                                        {grouped[category].map((test, i) => {
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

                                            const status = checkAbnormal(test.result, test.refRange);

                                            return (
                                                <tr key={`${category}-${i}`} className="print:break-inside-avoid">
                                                    <td className="py-3 pl-4">
                                                        <p className="font-semibold">{test.name}</p>
                                                        <p className="text-xs text-slate-400">Method: {test.method}</p>
                                                    </td>
                                                    <td className="py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold ${status ? 'text-red-600' : 'text-slate-800'}`}>
                                                                {test.result}
                                                            </span>
                                                            {status && (
                                                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${status === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {status}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 text-slate-500">{test.unit}</td>
                                                    <td className="py-3 pr-4 text-right text-slate-600 whitespace-pre-wrap">{test.refRange}</td>
                                                </tr>
                                            );
                                        })}
                                    </React.Fragment>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Disclaimer */}
                <footer className="mt-auto z-10 relative shrink-0">
                    <div className="border-t-2 border-slate-100 pt-4 print:break-inside-avoid">
                        <div className="flex justify-end items-end mb-4">
                            <div className="text-center relative">
                                {labTechSignature && (
                                    <img
                                        src={labTechSignature}
                                        alt="Lab Tech Signature"
                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 h-12 object-contain mix-blend-multiply opacity-90"
                                    />
                                )}
                                <div className="h-12 w-32 mb-2 border-b border-dashed border-slate-300"></div>
                                <p className="font-bold text-xs text-slate-800">Lab Technician</p>
                            </div>
                            <div className="text-center ml-12 relative">
                                {signature && (
                                    <img
                                        src={signature}
                                        alt="Signature"
                                        className="absolute bottom-8 left-1/2 -translate-x-1/2 h-12 object-contain mix-blend-multiply opacity-90"
                                    />
                                )}
                                <div className="h-12 w-32 mb-2 border-b border-dashed border-slate-300"></div>
                                <p className="font-bold text-xs text-slate-800">Pathologist</p>
                            </div>
                        </div>

                        <p className="text-[10px] text-slate-400 text-center leading-tight mb-2">
                            ** Interpretation: Results should be clinically correlated with the patient's history and other diagnostic findings.
                            Please consult your doctor for proper diagnosis and treatment.
                            This report is electronically generated and verified.
                        </p>

                        {/* Optional Image Footer */}
                        {footerImage && (
                            <img src={footerImage} alt="Footer" className="w-full mt-2 object-contain max-h-32" />
                        )}
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default PrintReport;

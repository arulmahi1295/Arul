import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Letterhead from './Letterhead';
import { storage } from '../data/storage';

const PrintReport = () => {
    const location = useLocation();
    const [reportData, setReportData] = useState(null);
    const [signature, setSignature] = useState(null);
    const [labTechSignature, setLabTechSignature] = useState(null);

    useEffect(() => {
        const loadSettings = async () => {
            const settings = await storage.getSettings();
            if (settings) {
                if (settings.signature) setSignature(settings.signature);
                if (settings.labTechSignature) setLabTechSignature(settings.labTechSignature);
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
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [reportData]);

    if (!reportData) return <div className="p-8 text-center text-slate-500">Loading report...</div>;

    return (
        <div className="bg-white min-h-screen p-8 max-w-[210mm] mx-auto print:p-0 print:max-w-none font-sans text-slate-800">
            <Letterhead
                title="DIAGNOSTIC REPORT"
                subtitle={`Report ID: ${reportData.id}`}
                meta={<>Reported: {new Date(reportData.date).toLocaleString()}</>}
            />

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
                <div className="bg-indigo-900 text-white px-4 py-2 text-sm font-bold uppercase tracking-wider mb-0 print:bg-slate-200 print:text-black">
                    HEMATOLOGY
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
                        {reportData.tests && reportData.tests.map((test, i) => {
                            const checkAbnormal = (val, range) => {
                                if (!range || !val) return null;
                                // Simple distinct numeric range check "min - max"
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
                                // Check for simple bounds like "< 5.0"
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
                                <tr key={i} className="print:break-inside-avoid">
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
                    </tbody>
                </table>
            </div>

            {/* Footer / Disclaimer */}
            <footer className="mt-auto border-t-2 border-slate-100 pt-4 print:fixed print:bottom-0 print:left-8 print:right-8 print:bg-white">
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

                <p className="text-[10px] text-slate-400 text-center leading-tight">
                    ** Interpretation: Results should be clinically correlated with the patient's history and other diagnostic findings.
                    Please consult your doctor for proper diagnosis and treatment.
                    This report is electronically generated and verified.
                </p>
            </footer>
        </div>
    );
};

export default PrintReport;

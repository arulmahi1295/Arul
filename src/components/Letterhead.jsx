import React from 'react';
import { MapPin, Phone, FileText } from 'lucide-react';

const Letterhead = ({ title, subtitle, meta }) => {
    return (
        <header className="border-b border-slate-200 pb-6 mb-8 flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-bold text-indigo-700 mb-2">LIMSPro Labs</h1>
                <div className="text-sm text-slate-500 space-y-1">
                    <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> 123 Health Avenue, Medical District</p>
                    <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> +1 (555) 123-4567</p>
                    <p className="flex items-center"><FileText className="h-4 w-4 mr-2" /> GSTIN: 22AAAAA0000A1Z5</p>
                </div>
            </div>
            <div className="text-right">
                {title && <h2 className="text-2xl font-bold text-slate-800 mb-1 uppercase">{title}</h2>}
                {subtitle && <p className="text-slate-500 font-medium">{subtitle}</p>}
                {meta && <div className="text-sm text-slate-400 mt-1">{meta}</div>}
            </div>
        </header>
    );
};

export default Letterhead;

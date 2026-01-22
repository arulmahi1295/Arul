import React from 'react';
import { MapPin, Phone, FileText, Leaf } from 'lucide-react';

const Letterhead = ({ title, subtitle, meta, labDetails }) => {
    // Default values if no configuration exists
    const details = {
        name: labDetails?.name || 'GreenHealth Lab',
        address: labDetails?.address || '37/A 15th Cross 16th Main Road BTM 2nd Stage Bengaluru 560076',
        phone: labDetails?.phone || '+91 83100 22139',
        gstin: labDetails?.gstin || '22AAAAA0000A1Z5',
        ...labDetails
    };

    return (
        <header className="border-b border-slate-200 pb-6 mb-8 flex justify-between items-start">
            <div>
                <div className="text-right">
                    <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-wider">GreenHealth <span className="text-emerald-600">Lab</span></h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        37/A 15th Cross 16th Main Road<br />
                        BTM 2nd Stage Bengaluru 560076
                    </p>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                        Phone: +91 83100 22139 | Email: contact@greenhealthlab.com
                    </p>
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

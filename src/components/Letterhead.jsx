import React from 'react';
import { MapPin, Phone, FileText, Leaf } from 'lucide-react';

const Letterhead = ({ title, subtitle, meta, labDetails }) => {
    // Default values if no configuration exists
    const details = {
        name: labDetails?.name || 'GreenHealth Lab',
        address: labDetails?.address || '123 Health Avenue, Medical District',
        phone: labDetails?.phone || '+91 83100 22139',
        gstin: labDetails?.gstin || '22AAAAA0000A1Z5',
        ...labDetails
    };

    return (
        <header className="border-b border-slate-200 pb-6 mb-8 flex justify-between items-start">
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <Leaf className="h-8 w-8 text-emerald-600" />
                    <h1 className="text-3xl font-bold text-emerald-700">{details.name}</h1>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                    <p className="flex items-center"><MapPin className="h-4 w-4 mr-2" /> {details.address}</p>
                    <p className="flex items-center"><Phone className="h-4 w-4 mr-2" /> {details.phone}</p>

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

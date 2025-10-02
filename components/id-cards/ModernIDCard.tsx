import React from 'react';

const ModernIDCard = ({ student, schoolSettings }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";

    return (
        <div className="w-64 h-96 bg-gray-900 text-white rounded-lg shadow-lg flex flex-col p-4 relative overflow-hidden font-sans">
            <div className="absolute -right-10 -top-10 w-32 h-32 bg-indigo-500 rounded-full opacity-30"></div>
            <div className="absolute -left-12 bottom-4 w-24 h-24 bg-purple-500 rounded-full opacity-30"></div>
            
            <div className="flex items-center space-x-2 z-10">
                 <img src={schoolSettings.schoolLogo || defaultLogo} alt="School Logo" className="w-10 h-10 rounded-full bg-white p-1"/>
                 <h1 className="font-semibold text-base">{schoolSettings.schoolName}</h1>
            </div>

            <div className="mt-6 flex items-center space-x-4 z-10">
                <div className="w-24 h-24 rounded-md overflow-hidden border-2 border-indigo-400">
                     <img src={student.photo} alt={student.name} className="w-full h-full object-cover"/>
                </div>
                <div>
                     <h2 className="text-lg font-bold leading-tight">{student.name}</h2>
                     <p className="text-sm text-indigo-300">{student.class}</p>
                </div>
            </div>

            <div className="mt-6 space-y-2 text-sm z-10">
                <div>
                    <p className="text-gray-400 text-xs">ADMISSION NO.</p>
                    <p className="font-mono">{student.admissionNo}</p>
                </div>
                 <div>
                    <p className="text-gray-400 text-xs">SESSION</p>
                    <p className="font-mono">{schoolSettings.session}</p>
                </div>
            </div>
             <div className="mt-auto text-center z-10">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Student Identity</p>
            </div>
        </div>
    );
};

export default ModernIDCard;

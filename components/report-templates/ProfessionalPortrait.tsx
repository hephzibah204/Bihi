import React from 'react';

const ProfessionalPortrait = ({ student, schoolSettings }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";

    return (
        <div className="w-64 h-96 bg-gray-50 rounded-lg shadow-2xl flex flex-col font-sans overflow-hidden border border-gray-200">
            <div className="bg-indigo-800 text-white p-4 text-center">
                <img src={schoolSettings.schoolLogo || defaultLogo} alt="Logo" className="w-12 h-12 mx-auto rounded-full border-2 border-white"/>
                <h1 className="font-bold mt-2 text-lg break-words">{schoolSettings.schoolName}</h1>
                <p className="text-xs text-indigo-200">{schoolSettings.schoolAddress}</p>
            </div>
            <div className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-md">
                    <img src={student.photo} alt={student.name} className="w-full h-full object-cover"/>
                </div>
                <p className="text-center mt-4 font-bold text-2xl text-gray-800 break-words">{student.name}</p>
                <p className="text-center text-sm text-gray-500 bg-gray-200 px-3 py-1 rounded-full mt-1">{student.class}</p>
                <div className="mt-4 text-left w-full text-xs space-y-1">
                    <p><strong>Admission No:</strong> {student.admissionNo}</p>
                    <p><strong>Session:</strong> {schoolSettings.session}</p>
                </div>
            </div>
            <div className="bg-indigo-800 text-white text-center py-2 text-sm font-semibold">
                STUDENT ID
            </div>
        </div>
    );
};

export default ProfessionalPortrait;
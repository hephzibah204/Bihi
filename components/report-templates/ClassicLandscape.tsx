import React from 'react';

const ClassicLandscape = ({ student, schoolSettings }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";

    return (
        <div className="w-96 h-64 bg-white rounded-lg shadow-xl flex p-4 font-sans border-t-8 border-blue-900">
            <div className="flex flex-col items-center pr-4 border-r">
                <img src={student.photo} alt={student.name} className="w-28 h-32 object-cover rounded-md border-2 border-gray-300"/>
                <div className="mt-2 text-center">
                    <p className="text-xs text-gray-500">Signature</p>
                </div>
            </div>
            <div className="pl-4 flex flex-col justify-between">
                <div>
                     <div className="flex items-center space-x-2">
                        <img src={schoolSettings.schoolLogo || defaultLogo} alt="Logo" className="w-10 h-10"/>
                        <div>
                             <h1 className="font-extrabold text-xl text-blue-900 break-words">{schoolSettings.schoolName}</h1>
                             <p className="text-xs text-gray-500">{schoolSettings.schoolAddress}</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <p className="font-semibold text-2xl break-words">{student.name}</p>
                        <div className="text-sm mt-1">
                            <p><strong>Class:</strong> {student.class}</p>
                            <p><strong>Admission No:</strong> {student.admissionNo}</p>
                            <p><strong>Session:</strong> {schoolSettings.session}</p>
                        </div>
                    </div>
                </div>
                 <p className="text-xs text-right font-semibold text-blue-900">STUDENT IDENTITY CARD</p>
            </div>
        </div>
    );
};

export default ClassicLandscape;
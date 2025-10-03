import React from 'react';

const BasicPortrait = ({ student, schoolSettings }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";

    return (
        <div className="w-64 h-96 bg-white rounded-lg shadow-md flex flex-col items-center p-4 font-sans border border-gray-200">
            <img src={schoolSettings.schoolLogo || defaultLogo} alt="School Logo" className="w-16 h-16 mx-auto"/>
            <h1 className="font-bold text-center mt-2 break-words">{schoolSettings.schoolName}</h1>
            <div className="mt-4 w-32 h-32 mx-auto">
                <img src={student.photo} alt={student.name} className="w-full h-full object-cover rounded-full border-4 border-gray-300"/>
            </div>
            <p className="mt-4 font-bold text-xl break-words text-center">{student.name}</p>
            <p className="text-gray-600">{student.class}</p>
            <div className="mt-auto border-t w-full pt-2 text-center">
                <p className="text-xs text-gray-500">Admission No.</p>
                <p className="font-mono">{student.admissionNo}</p>
            </div>
        </div>
    );
};

export default BasicPortrait;
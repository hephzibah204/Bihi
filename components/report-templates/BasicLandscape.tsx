import React from 'react';

const BasicLandscape = ({ student, schoolSettings }) => {
     const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
    return (
        <div className="w-96 h-64 bg-white rounded-lg shadow-md p-4 flex items-center space-x-4 border border-gray-200">
             <div className="w-28 h-full flex flex-col items-center justify-center p-2 bg-gray-100 rounded-md">
                <img src={student.photo} alt={student.name} className="w-24 h-24 object-cover rounded-full border-2 border-white shadow-sm"/>
             </div>
            <div className="flex flex-col justify-center">
                 <div className="flex items-center space-x-2">
                    <img src={schoolSettings.schoolLogo || defaultLogo} alt="Logo" className="w-8 h-8"/>
                    <h1 className="font-bold text-lg break-words">{schoolSettings.schoolName}</h1>
                 </div>
                <div className="mt-4">
                    <p className="font-semibold text-2xl break-words">{student.name}</p>
                    <p className="text-gray-600"><strong>Class:</strong> {student.class}</p>
                    <p className="text-gray-600"><strong>Admission No:</strong> {student.admissionNo}</p>
                </div>
            </div>
        </div>
    );
};

export default BasicLandscape;
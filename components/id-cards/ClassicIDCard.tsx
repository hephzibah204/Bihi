
import React from 'react';
import { useQRCodeGenerator } from '../../hooks/useQRCodeGenerator';

const ClassicIDCard = ({ student, schoolSettings }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
    const qrCodeUrl = useQRCodeGenerator(student.admissionNo);

    return (
        <div className="w-64 h-96 bg-white rounded-lg shadow-lg flex flex-col items-center p-4 font-sans border-2 border-blue-800">
            <div className="flex items-center space-x-2">
                <img src={schoolSettings.schoolLogo || defaultLogo} alt="School Logo" className="w-12 h-12 rounded-full"/>
                <h1 className="text-blue-800 font-bold text-lg text-center break-words">{schoolSettings.schoolName}</h1>
            </div>
            <div className="mt-4 w-36 h-36 rounded-full border-4 border-blue-800 overflow-hidden">
                <img src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} alt={student.name} className="w-full h-full object-cover"/>
            </div>
            <h2 className="mt-4 text-xl font-bold text-gray-800 text-center break-words">{student.name}</h2>
            <div className="mt-2 text-sm text-gray-600">
                <p><strong>Class:</strong> {student.class}</p>
                <p><strong>Admission No:</strong> {student.admissionNo}</p>
            </div>
            <div className="mt-auto w-full text-center">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="h-16 w-16 mx-auto" />}
                <div className="bg-blue-800 text-white py-1 rounded-md text-sm mt-2">
                    Student ID Card
                </div>
            </div>
        </div>
    );
};

export default ClassicIDCard;

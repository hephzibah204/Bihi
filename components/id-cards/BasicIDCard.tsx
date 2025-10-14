import React from 'react';
import { useQRCodeGenerator } from '../../hooks/useQRCodeGenerator';

const BasicIDCard = ({ student, schoolSettings }) => {
    const defaultLogo = "https://i.imgur.com/gKEBi1f.png";
    const qrCodeUrl = useQRCodeGenerator(student.admissionNo);

    return (
        <div className="w-64 h-96 bg-white rounded-lg shadow-md flex flex-col items-center p-4 font-sans border border-gray-200">
            <img src={schoolSettings.schoolLogo || defaultLogo} alt="School Logo" className="w-16 h-16 mx-auto"/>
            <h1 className="font-bold text-center mt-2 break-words">{schoolSettings.schoolName}</h1>
            <div className="mt-4 w-32 h-32 mx-auto">
                <img src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} alt={student.name} className="w-full h-full object-cover rounded-full border-4 border-gray-300"/>
            </div>
            <p className="mt-4 font-bold text-xl break-words text-center">{student.name}</p>
            <p className="text-gray-600">{student.class}</p>
            <div className="mt-auto border-t w-full pt-2 text-center">
                {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="h-16 w-16 mx-auto mb-1" />}
                <p className="text-xs text-gray-500">Admission No.</p>
                <p className="font-mono">{student.admissionNo}</p>
            </div>
        </div>
    );
};

export default BasicIDCard;

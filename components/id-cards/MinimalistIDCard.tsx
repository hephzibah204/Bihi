
import React from 'react';
import { useQRCodeGenerator } from '../../hooks/useQRCodeGenerator';

const MinimalistIDCard = ({ student, schoolSettings }) => {
    const { qrCodeUrl } = useQRCodeGenerator(student.admissionNo);

    return (
        <div className="w-64 h-96 bg-white rounded-lg shadow-lg flex flex-col justify-between p-6 font-sans">
            <div>
                <h1 className="font-bold text-2xl text-gray-800 tracking-tighter break-words">{schoolSettings.schoolName}</h1>
                <p className="text-xs text-gray-400">Student Identification</p>
            </div>
            <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full overflow-hidden">
                    <img src={student.photo || `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(student.name)}`} alt={student.name} className="w-full h-full object-cover"/>
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-gray-900 leading-tight break-words">{student.name}</h2>
                    <p className="text-gray-600">{student.class}</p>
                </div>
            </div>
            <div>
                 <p className="text-xs text-gray-400">Admission No.</p>
                 <p className="font-mono text-lg text-gray-800 mb-2">{student.admissionNo}</p>
                 {qrCodeUrl && <img src={qrCodeUrl} alt="QR Code" className="h-16 w-16" />}
            </div>
        </div>
    );
};

export default MinimalistIDCard;

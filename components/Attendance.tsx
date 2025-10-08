import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiGetSubjects, apiGetAttendance, apiSaveAttendanceRecord, apiGetStudents } from '../services/api';
import FaceIdIcon from './icons/FaceIdIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import Modal from './Modal';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';
import { Student, Subject } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { exportToCSV } from '../utils/csvExporter';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';

declare global {
    interface Window {
        Html5Qrcode: any;
        faceapi: any;
    }
}

const Attendance = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState({ message: '', type: '' });
    
    const [isRecognitionModalOpen, setRecognitionModalOpen] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [recognitionStatus, setRecognitionStatus] = useState({ message: 'Align your face in the frame.', type: 'info'});
    const videoRef = useRef(null);
    const recognitionIntervalRef = useRef(null);

    const attendanceRef = useRef(attendance);
    useEffect(() => { attendanceRef.current = attendance; }, [attendance]);

    const studentsRef = useRef(students);
    useEffect(() => { studentsRef.current = students; }, [students]);

    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchInitialData = useCallback(async () => {
        setLoading(true);
        const subjects: Subject[] = await apiGetSubjects();
        const allClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();
        setClasses(allClasses);
        if (allClasses.length > 0 && !selectedClass) {
            setSelectedClass(allClasses[0]);
        }
        setLoading(false);
    }, [selectedClass]);

    useEffect(() => {
        fetchInitialData();
        const loadModels = async () => {
            if (!window.faceapi) return;
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
            try {
                await Promise.all([
                    window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
                    window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
                    window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
                ]);
                setModelsLoaded(true);
            } catch (error) { console.error("Failed to load face-api models", error); }
        };
        loadModels();
    }, [fetchInitialData]);

    useEffect(() => {
        const fetchStudentsAndAttendance = async () => {
            if (!selectedClass) return;
            setLoading(true);
            const [fetchedStudents, dailyAttendance] = await Promise.all([
                apiGetStudents({ classFilter: selectedClass }),
                apiGetAttendance({ date: selectedDate })
            ]);
            setStudents(fetchedStudents);
            setAttendance(dailyAttendance[0]?.statuses || {});
            setLoading(false);
        };
        fetchStudentsAndAttendance();
    }, [selectedClass, selectedDate]);

    useEffect(() => {
        if (Object.keys(attendance).length === 0) return; // Don't save on initial empty state
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
            apiSaveAttendanceRecord({ date: selectedDate, statuses: attendanceRef.current });
        }, 1000);
        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [attendance, selectedDate]);

    const handleStatusChange = useCallback((studentId: string, status: string) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    }, []);

    useEffect(() => {
        if (!isScannerOpen || !document.getElementById("qr-reader") || typeof window.Html5Qrcode === 'undefined') return;
        const onScanSuccess = (decodedText: string) => {
            const student = studentsRef.current.find(s => s.admissionNo === decodedText);
            if (student) {
                handleStatusChange(student.id, 'present');
                setScanResult({ message: `${student.name} marked present!`, type: 'success' });
            } else {
                setScanResult({ message: `Student ID ${decodedText} not found in this class.`, type: 'error' });
            }
             setTimeout(() => setScanResult({ message: '', type: '' }), 3000);
        };
        let html5QrCode: any;
        try {
            html5QrCode = new window.Html5Qrcode("qr-reader");
            html5QrCode.start({ facingMode: "environment" }, { fps: 10, qrbox: { width: 250, height: 250 } }, onScanSuccess, () => {});
        } catch(e) { console.error(e) }
        return () => { if (html5QrCode?.isScanning) html5QrCode.stop().catch(console.error); };
    }, [isScannerOpen, handleStatusChange]);

    useEffect(() => {
        if (isRecognitionModalOpen && modelsLoaded) {
            startVideo();
        } else {
            stopVideo();
        }
        return () => stopVideo();
    }, [isRecognitionModalOpen, modelsLoaded]);

    const startVideo = () => {
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => { if (videoRef.current) videoRef.current.srcObject = stream; })
            .catch(() => setRecognitionStatus({ message: 'Camera access denied.', type: 'error' }));
    };

    const stopVideo = () => {
        if (recognitionIntervalRef.current) clearInterval(recognitionIntervalRef.current);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track: any) => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const handleVideoPlay = async () => {
        if (!window.faceapi) return;
        const enrolledStudents = studentsRef.current.filter(s => s.faceDescriptor && s.faceDescriptor.length > 0);
        if (enrolledStudents.length === 0) {
            setRecognitionStatus({ message: 'No students in this class have Face ID enrolled.', type: 'error' });
            return;
        }
        const labeledFaceDescriptors = enrolledStudents.map(s => new window.faceapi.LabeledFaceDescriptors(s.id, [Float32Array.from(s.faceDescriptor)]));
        const faceMatcher = new window.faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        recognitionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            const detections = await window.faceapi.detectAllFaces(videoRef.current).withFaceLandmarks().withFaceDescriptors();
            if (detections.length > 0) {
                const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
                const student = studentsRef.current.find(s => s.id === bestMatch.label);
                if (student && bestMatch.label !== 'unknown') {
                    if (attendanceRef.current[student.id] !== 'present') handleStatusChange(student.id, 'present');
                    setRecognitionStatus({ message: `Welcome, ${student.name}!`, type: 'success' });
                } else {
                    setRecognitionStatus({ message: 'Unknown face detected.', type: 'info' });
                }
            }
        }, 2000);
    };

    const handleExport = () => {
        const dataToExport = students.map(student => ({
            student_name: student.name,
            admission_no: student.admissionNo,
            status: attendance[student.id] || 'N/A'
        }));
        exportToCSV(dataToExport, `attendance_${selectedClass}_${selectedDate}.csv`);
    };

    const handleCloseScanner = () => { setScannerOpen(false); setScanResult({ message: '', type: '' }); };
    const handleCloseRecognition = () => { setRecognitionModalOpen(false); setRecognitionStatus({ message: 'Align your face in the frame.', type: 'info'}); };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="mt-2 flex items-center space-x-4">
                    <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field">
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="input-field"
                        aria-label="Select attendance date"
                        max={new Date().toISOString().split('T')[0]}
                    />
                </div>
                 <div className="flex space-x-2">
                    <button onClick={handleExport} className="btn btn-secondary" disabled={students.length === 0}><ArrowDownTrayIcon className="w-5 h-5 mr-2" /> Export</button>
                    <button onClick={() => setRecognitionModalOpen(true)} className="btn btn-secondary"><FaceIdIcon className="w-5 h-5 mr-2" /> Facial Recognition</button>
                    <button onClick={() => setScannerOpen(true)} className="btn btn-secondary"><QrCodeIcon className="w-5 h-5 mr-2" /> QR Code Scan</button>
                </div>
            </div>
            
            <div className="table-container mt-6">
                <table className="table">
                     <thead><tr><th className="th">Student Name</th><th className="th text-center">Status</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan={2} className="td text-center">Loading students...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={2} className="td text-center">No students in this class.</td></tr>
                        ) : (
                            students.map(student => {
                                const status = attendance[student.id] || 'present';
                                return (
                                <tr key={student.id}>
                                    <td className="td font-medium"><div className="truncate max-w-sm" title={student.name}>{student.name}</div></td>
                                    <td className="td">
                                        <div className="flex flex-col sm:flex-row justify-center items-center gap-2">
                                            <button onClick={() => handleStatusChange(student.id, 'present')} className={`btn text-sm px-3 py-1 w-full sm:w-auto ${status === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Present</button>
                                            <button onClick={() => handleStatusChange(student.id, 'late')} className={`btn text-sm px-3 py-1 w-full sm:w-auto ${status === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>Late</button>
                                            <button onClick={() => handleStatusChange(student.id, 'absent')} className={`btn text-sm px-3 py-1 w-full sm:w-auto ${status === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Absent</button>
                                        </div>
                                    </td>
                                </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

             <Modal isOpen={isScannerOpen} onClose={handleCloseScanner} title="Scan Student QR Code">
                <div className="p-4">
                    <div id="qr-reader" className="w-full"></div>
                    {scanResult.message && <div className={`mt-4 p-3 rounded-lg flex items-center justify-center text-sm ${scanResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{scanResult.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <XIcon className="w-5 h-5 mr-2" />}{scanResult.message}</div>}
                </div>
            </Modal>
            
             <Modal isOpen={isRecognitionModalOpen} onClose={handleCloseRecognition} title="Face Recognition Attendance">
                <div className="p-4 text-center">
                     {!modelsLoaded ? <p>Loading AI models...</p> :
                     <>
                        <div className="w-full bg-black rounded-lg overflow-hidden aspect-video mx-auto"><video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} className="w-full h-full object-cover"></video></div>
                         <div className={`mt-4 p-3 rounded-lg flex items-center justify-center text-sm font-semibold ${recognitionStatus.type === 'success' ? 'bg-green-100 text-green-800' : recognitionStatus.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{recognitionStatus.message}</div>
                     </>
                    }
                </div>
            </Modal>
        </div>
    );
};

export default Attendance;
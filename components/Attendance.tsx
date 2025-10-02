import React, { useState, useEffect, useRef, useCallback } from 'react';
import { apiGetStudentsForClasses, apiGetSubjects, apiGetAttendance, updateAttendance, apiGetStudents } from '../services/api';
import FaceIdIcon from './icons/FaceIdIcon';
import QrCodeIcon from './icons/QrCodeIcon';
import Modal from './Modal';
import CheckIcon from './icons/CheckIcon';
import XIcon from './icons/XIcon';
import { Subject } from '../types';

// CDN libraries are declared on the window object
declare global {
    interface Window {
        Html5Qrcode: any;
        faceapi: any;
    }
}


const Attendance = () => {
    const [classes, setClasses] = useState<string[]>([]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [loading, setLoading] = useState(false);
    const [currentDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
    
    // QR Scanner State
    const [isScannerOpen, setScannerOpen] = useState(false);
    const [scanResult, setScanResult] = useState({ message: '', type: '' });
    
    // Face Recognition State
    const [isRecognitionModalOpen, setRecognitionModalOpen] = useState(false);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [recognitionStatus, setRecognitionStatus] = useState({ message: 'Align your face in the frame.', type: 'info'});
    const videoRef = useRef(null);
    const recognitionIntervalRef = useRef(null);

    const attendanceRef = useRef(attendance);
    useEffect(() => {
        attendanceRef.current = attendance;
    }, [attendance]);

    const studentsRef = useRef(students);
    useEffect(() => {
        studentsRef.current = students;
    }, [students]);

    const isInitialMount = useRef(true);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchClassesAndData = useCallback(async () => {
        const subjects: Subject[] = await apiGetSubjects();
        const allClasses = [...new Set(subjects.flatMap(s => s.classes))].sort();
        setClasses(allClasses);
        if (allClasses.length > 0 && !selectedClass) {
            setSelectedClass(allClasses[0]);
        }
    }, [selectedClass]);

    const fetchStudentsAndAttendance = useCallback(async () => {
        if (!selectedClass) return;
        
        isInitialMount.current = true; // Prevent saving when data for a new class is loaded
        
        setLoading(true);
        const [fetchedStudents, allAttendance] = await Promise.all([
            apiGetStudentsForClasses([selectedClass]),
            apiGetAttendance()
        ]);
        
        setStudents(fetchedStudents);
        
        const todayAttendance = allAttendance.find(rec => rec.date === currentDate);
        if (todayAttendance) {
            setAttendance(todayAttendance.statuses || {});
        } else {
            setAttendance({});
        }
        setLoading(false);
    }, [selectedClass, currentDate]);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            await updateAttendance(allAttendance => {
                 const otherDaysAttendance = allAttendance.filter(rec => rec.date !== currentDate);
                 const newRecord = { date: currentDate, statuses: attendanceRef.current };
                 return [...otherDaysAttendance, newRecord];
            });
        }, 500);

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [attendance, currentDate]);


    useEffect(() => {
        const loadModels = async () => {
            if (!window.faceapi) {
                console.error("face-api.js has not loaded. Face recognition features will be disabled.");
                return;
            }
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
            try {
                await window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
                await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
                await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
                setModelsLoaded(true);
            } catch (error) {
                console.error("Failed to load face-api models", error);
            }
        };
        loadModels();
    }, []);

    useEffect(() => {
        fetchClassesAndData();
    }, [fetchClassesAndData]);

    useEffect(() => {
        fetchStudentsAndAttendance();
    }, [fetchStudentsAndAttendance]);

    useEffect(() => {
        const handleStorageUpdate = (event: Event) => {
            const customEvent = event as CustomEvent;
            const key = customEvent.detail?.key;
            if (key === 'subjects') {
                fetchClassesAndData();
            } else if (key === 'students' || key === 'attendance') {
                fetchStudentsAndAttendance();
            }
        };
        window.addEventListener('storage-update', handleStorageUpdate);
        return () => window.removeEventListener('storage-update', handleStorageUpdate);
    }, [fetchClassesAndData, fetchStudentsAndAttendance]);
    
    const handleStatusChange = useCallback((studentId: string, status: string) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    }, []);

    // QR Code Scanner Effect
     useEffect(() => {
        if (!isScannerOpen || !document.getElementById("qr-reader")) return;
        
        if (typeof window.Html5Qrcode === 'undefined') {
            console.error("Html5Qrcode library not loaded.");
            setScanResult({ message: "QR Scanner library failed to load.", type: "error" });
            return;
        }

        const onScanSuccess = (decodedText: string) => {
            // Use ref to get the latest list of students, preventing stale closure issues
            const student = studentsRef.current.find(s => s.admissionNo === decodedText);
            if (student) {
                handleStatusChange(student.id, 'present');
                setScanResult({ message: `${student.name} marked as present!`, type: 'success' });
            } else {
                setScanResult({ message: `Student with ID ${decodedText} not found in this class.`, type: 'error' });
            }
             setTimeout(() => setScanResult({ message: '', type: '' }), 3000);
        };
    
        const onScanFailure = (error: any) => {};

        let html5QrCode: any;
        try {
            html5QrCode = new window.Html5Qrcode("qr-reader");
            const config = { fps: 10, qrbox: { width: 250, height: 250 } };
            
            html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanFailure)
                .catch((err: any) => {
                    console.error("QR Scanner Error:", err);
                    setScanResult({ message: "Could not start camera.", type: "error" });
                });
        } catch(e) {
            console.error(e)
        }


        return () => {
            if (html5QrCode && html5QrCode.isScanning) {
                html5QrCode.stop().catch((err: any) => console.error("Error stopping scanner:", err));
            }
        };
    }, [isScannerOpen, handleStatusChange]);
    
    // Face Recognition Effect
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
            .then(stream => {
                if (videoRef.current) videoRef.current.srcObject = stream;
            })
            .catch(err => setRecognitionStatus({ message: 'Camera access denied.', type: 'error' }));
    };

    const stopVideo = () => {
        if (recognitionIntervalRef.current) {
            clearInterval(recognitionIntervalRef.current);
        }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach((track: any) => track.stop());
            videoRef.current.srcObject = null;
        }
    };
    
    const handleVideoPlay = async () => {
        if (!window.faceapi) {
            setRecognitionStatus({ message: 'Face recognition service is unavailable.', type: 'error' });
            return;
        }
        const allStudents = await apiGetStudents();
        const enrolledStudents = allStudents.filter(s => s.class === selectedClass && s.faceDescriptor);

        if (enrolledStudents.length === 0) {
            setRecognitionStatus({ message: 'No students in this class have Face ID enrolled.', type: 'error' });
            return;
        }

        const labeledFaceDescriptors = enrolledStudents.map(s => 
            new window.faceapi.LabeledFaceDescriptors(s.id, [Float32Array.from(s.faceDescriptor)])
        );
        const faceMatcher = new window.faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

        recognitionIntervalRef.current = setInterval(async () => {
            if (!videoRef.current) return;
            const detections = await window.faceapi.detectAllFaces(videoRef.current)
                .withFaceLandmarks()
                .withFaceDescriptors();
            
            if (detections.length > 0) {
                const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor);
                const studentId = bestMatch.label;
                const student = allStudents.find(s => s.id === studentId);

                if (student && studentId !== 'unknown') {
                    if (attendanceRef.current[studentId] !== 'present') {
                        handleStatusChange(studentId, 'present');
                    }
                    setRecognitionStatus({ message: `Welcome, ${student.name}!`, type: 'success' });
                } else {
                    setRecognitionStatus({ message: 'Unknown face detected.', type: 'info' });
                }
            }
        }, 2000);
    };

    const handleCloseScanner = () => {
        setScannerOpen(false);
        setScanResult({ message: '', type: '' });
    };
    
     const handleCloseRecognition = () => {
        setRecognitionModalOpen(false);
        setRecognitionStatus({ message: 'Align your face in the frame.', type: 'info'});
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Take Attendance</h1>
                    <div className="mt-2 flex items-center space-x-4">
                        <select 
                            className="input-field"
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                        >
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <div className="p-2 bg-white dark:bg-gray-800 rounded-md shadow-sm">
                            <strong>Date:</strong> {new Date(currentDate).toLocaleDateString()}
                        </div>
                    </div>
                </div>
                 <div className="flex space-x-2">
                    <button onClick={() => setRecognitionModalOpen(true)} className="btn btn-secondary">
                        <FaceIdIcon className="w-5 h-5 mr-2" />
                        Facial Recognition
                    </button>
                    <button onClick={() => setScannerOpen(true)} className="btn btn-secondary">
                         <QrCodeIcon className="w-5 h-5 mr-2" />
                        QR Code Scan
                    </button>
                </div>
            </div>
            
            <div className="table-container mt-6">
                <table className="table">
                     <thead>
                        <tr>
                            <th className="th">Student Name</th>
                            <th className="th text-center">Status</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {loading ? (
                            <tr><td colSpan={2} className="td text-center">Loading students...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={2} className="td text-center">No students in this class.</td></tr>
                        ) : (
                            students.map(student => {
                                const status = attendance[student.id] || 'present';
                                return (
                                <tr key={student.id}>
                                    <td className="td font-medium">{student.name}</td>
                                    <td className="td">
                                        <div className="flex justify-center space-x-2">
                                            <button onClick={() => handleStatusChange(student.id, 'present')} className={`btn text-sm px-3 py-1 ${status === 'present' ? 'btn-present-active' : 'btn-present'}`}>Present</button>
                                            <button onClick={() => handleStatusChange(student.id, 'late')} className={`btn text-sm px-3 py-1 ${status === 'late' ? 'btn-late-active' : 'btn-late'}`}>Late</button>
                                            <button onClick={() => handleStatusChange(student.id, 'absent')} className={`btn text-sm px-3 py-1 ${status === 'absent' ? 'btn-absent-active' : 'btn-absent'}`}>Absent</button>
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
                    {scanResult.message && (
                        <div className={`mt-4 p-3 rounded-lg flex items-center justify-center text-sm ${scanResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {scanResult.type === 'success' ? <CheckIcon className="w-5 h-5 mr-2" /> : <XIcon className="w-5 h-5 mr-2" />}
                            {scanResult.message}
                        </div>
                    )}
                </div>
            </Modal>
            
             <Modal isOpen={isRecognitionModalOpen} onClose={handleCloseRecognition} title="Face Recognition Attendance">
                <div className="p-4 text-center">
                     {!modelsLoaded ? <p>Loading AI models...</p> :
                     <>
                        <div className="w-full bg-black rounded-lg overflow-hidden aspect-video mx-auto">
                            <video ref={videoRef} autoPlay muted playsInline onPlay={handleVideoPlay} className="w-full h-full object-cover"></video>
                        </div>
                         <div className={`mt-4 p-3 rounded-lg flex items-center justify-center text-sm font-semibold ${
                            recognitionStatus.type === 'success' ? 'bg-green-100 text-green-800' : 
                            recognitionStatus.type === 'error' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                        }`}>
                            {recognitionStatus.message}
                        </div>
                     </>
                    }
                </div>
            </Modal>
        </div>
    );
};

export default Attendance;
import React, { useState, useEffect, useMemo } from 'react';
import { apiGetAttendance, apiSaveAttendance, apiGetStudents, apiSaveTeacherAttendance } from '../services/api';
import { AttendanceRecord, Student, TeacherAttendanceRecord } from '../types';
import { formatDate } from '../utils/dateHelpers';
import { useTenant } from '../contexts/TenantContext';
import { generateClassNames } from '../utils/classManager';
import TableSkeleton from './skeletons/TableSkeleton';
import EmptyState from './EmptyState';
import { parseStandardQRPayload } from '../utils/qrCodeGenerator';
import { apiVerifyQRSignature } from '../services/qr';
import { useAuth } from '../contexts/AuthContext';
import { useGeolocationFence } from '../hooks/useGeolocationFence';
import { useTeacherPresenceWatcher } from '../hooks/useTeacherPresenceWatcher';

const Attendance = () => {
    const { user, role } = useAuth();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, 'present' | 'absent' | 'late'>>({});
    const [loading, setLoading] = useState(false);
    const { settings } = useTenant();
    const classNames = useMemo(() => generateClassNames(settings), [settings]);

    const { reading, error: geoError, capture, validate } = useGeolocationFence();
    const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'inside' | 'outside' | 'saved' | 'error'>('idle');
    const [distanceInfo, setDistanceInfo] = useState<string>('');
    const [validCaptureCount, setValidCaptureCount] = useState<number>(0);

    useEffect(() => {
        if(classNames.length > 0 && !selectedClass) {
            setSelectedClass(classNames[0]);
        }
    }, [classNames, selectedClass]);
    
    useEffect(() => {
        const fetchAttendanceData = async () => {
            if (!selectedClass || !date) return;
            setLoading(true);
            const allStudents = await apiGetStudents({ classFilter: selectedClass });
            setStudents(allStudents);
            
            const records = await apiGetAttendance();
            const recordForDay = records.find(r => r.date === date && r.class === selectedClass);

            if (recordForDay) {
                setAttendance(recordForDay.statuses);
            } else {
                // Default all to present
                const initialStatuses = allStudents.reduce((acc, student) => {
                    acc[student.id] = 'present';
                    return acc;
                }, {});
                setAttendance(initialStatuses);
            }
            setLoading(false);
        };
        fetchAttendanceData();
    }, [date, selectedClass]);

    const handleCaptureLocation = async () => {
        setGeoStatus('locating');
        const loc = await capture();
        if (!loc) { setGeoStatus('error'); return; }
        const res = validate(loc, settings?.premisesGeofences || [], settings?.geofenceRules || {});
        if (res.nearest) setDistanceInfo(`${Math.round(res.nearest.distance_m)} m to site`);
        if (res.inside) {
            setValidCaptureCount(prev => prev + 1);
            setGeoStatus('inside');
        } else {
            setValidCaptureCount(0);
            setGeoStatus('outside');
        }
    };

    const handleConfirmPresent = async () => {
        if (!user || role !== 'Teacher' || !reading) return;
        const record: TeacherAttendanceRecord = {
            teacherId: (user as any).id,
            timestamp: new Date().toISOString(),
            status: 'present',
            lat: reading.lat,
            lng: reading.lng,
            accuracy_m: reading.accuracy_m,
            method: 'geofence',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
            notes: JSON.stringify({ captures: validCaptureCount })
        };
        try {
            await apiSaveTeacherAttendance(record);
            setGeoStatus('saved');
            setValidCaptureCount(0);
        } catch {
            setGeoStatus('error');
        }
    };

    const handleConfirmPresentManual = async () => {
        if (!user || role !== 'Teacher') return;
        const record: TeacherAttendanceRecord = {
            teacherId: (user as any).id,
            timestamp: new Date().toISOString(),
            status: 'present',
            method: 'manual',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        };
        try {
            await apiSaveTeacherAttendance(record);
            setGeoStatus('saved');
        } catch {
            setGeoStatus('error');
        }
    };

    const handleStatusChange = async (studentId: string, status: 'present' | 'absent' | 'late') => {
        const newAttendance = { ...attendance, [studentId]: status };
        setAttendance(newAttendance);
        
        const record: AttendanceRecord = {
            date,
            class: selectedClass,
            statuses: newAttendance,
        };
        await apiSaveAttendance(record);
    };

    const markAll = async (status: 'present' | 'absent' | 'late') => {
        const newAttendance = students.reduce((acc, student) => {
            acc[student.id] = status;
            return acc;
        }, {});
        setAttendance(newAttendance);
         const record: AttendanceRecord = {
            date,
            class: selectedClass,
            statuses: newAttendance,
        };
        await apiSaveAttendance(record);
    };
    
    const StatusButton = ({ studentId, currentStatus }: { studentId: string, currentStatus: string }) => (
        <div className="flex rounded-lg shadow-sm">
            <button onClick={() => handleStatusChange(studentId, 'present')} className={`px-3 py-1 text-sm rounded-l-md ${currentStatus === 'present' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Present</button>
            <button onClick={() => handleStatusChange(studentId, 'late')} className={`px-3 py-1 text-sm border-y ${currentStatus === 'late' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>Late</button>
            <button onClick={() => handleStatusChange(studentId, 'absent')} className={`px-3 py-1 text-sm rounded-r-md ${currentStatus === 'absent' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Absent</button>
        </div>
    );

    const [isQRModalOpen, setQRModalOpen] = useState(false);
    const [isQRScanOpen, setQRScanOpen] = useState(false);
    const [isFaceModalOpen, setFaceModalOpen] = useState(false);

    const QRModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">QR Attendance</h3>
                <p className="text-sm text-gray-500 mb-4">Enter or scan student admission number from QR to mark present.</p>
                <input id="qr-input" className="input-field w-full" placeholder="Paste scanned payload (RS1|...) or admission no" />
                <div className="flex justify-end gap-2 mt-4">
                    <button className="btn btn-secondary" onClick={() => setQRModalOpen(false)}>Close</button>
                    <button className="btn btn-primary" onClick={async () => {
                        const el = document.getElementById('qr-input') as HTMLInputElement;
                        const raw = (el?.value || '').trim();
                        let targetId: string | undefined;
                        let admission: string | undefined;
                        if (raw.startsWith('RS1|')) {
                            const parsed = parseStandardQRPayload(raw);
                            targetId = parsed?.studentId;
                            admission = parsed?.admissionNo;
                            const sig = parsed?.signature;
                            if (sig) {
                                const core = raw.split('|').filter(p => !p.startsWith('SIG=')).join('|');
                                const ok = await apiVerifyQRSignature(core, sig);
                                if (!ok) { alert('Invalid QR signature.'); return; }
                            }
                        } else {
                            admission = raw;
                        }
                        let student = targetId ? students.find(s => s.id === targetId) : undefined;
                        if (!student && admission) student = students.find(s => s.admissionNo === admission);
                        if (student) {
                            handleStatusChange(student.id, 'present');
                            el.value = '';
                            setQRModalOpen(false);
                        } else {
                            alert('No matching student found from payload');
                        }
                    }}>Mark Present</button>
                </div>
            </div>
        </div>
    );

    const FaceModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-md p-6">
                <h3 className="text-lg font-semibold mb-2">Facial Recognition (Demo)</h3>
                <p className="text-sm text-gray-500 mb-4">This demo simulates face scan and marks the selected student present.</p>
                <select id="face-student" className="input-field w-full">
                    {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                </select>
                <div className="flex justify-end gap-2 mt-4">
                    <button className="btn btn-secondary" onClick={() => setFaceModalOpen(false)}>Close</button>
                    <button className="btn btn-primary" onClick={() => {
                        const el = document.getElementById('face-student') as HTMLSelectElement;
                        const id = el?.value;
                        if (id) {
                            handleStatusChange(id, 'present');
                            setFaceModalOpen(false);
                        }
                    }}>Mark Present</button>
                </div>
            </div>
        </div>
    );

    const QRScannerModal = () => {
        const videoRef = React.useRef<HTMLVideoElement>(null);
        const canvasRef = React.useRef<HTMLCanvasElement>(document.createElement('canvas'));
        const [error, setError] = useState<string | null>(null);
        const [scanning, setScanning] = useState(false);
        const ensureJsQRLoaded = async () => {
            if ((window as any).jsQR) return;
            await new Promise<void>((resolve, reject) => {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js';
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => reject(new Error('Failed to load jsQR'));
                document.head.appendChild(script);
            });
        };
        const stopStream = () => {
            const v = videoRef.current;
            const stream = v?.srcObject as MediaStream | null;
            stream?.getTracks().forEach(t => t.stop());
            if (v) v.srcObject = null;
        };
        const decodeFromImageFile = async (file: File) => {
            try {
                await ensureJsQRLoaded();
                const url = URL.createObjectURL(file);
                const img = new Image();
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => resolve();
                    img.onerror = () => reject(new Error('Failed to load image'));
                    img.src = url;
                });
                const w = img.naturalWidth || 640;
                const h = img.naturalHeight || 480;
                const canvas = canvasRef.current;
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) throw new Error('Canvas context not available');
                ctx.drawImage(img, 0, 0, w, h);
                const imageData = ctx.getImageData(0, 0, w, h);
                const code = (window as any).jsQR(imageData.data, w, h);
                URL.revokeObjectURL(url);
                const raw = code?.data || '';
                if (!raw) throw new Error('No QR code detected in image');
                // Reuse the same parsing and marking logic as stream loop
                let targetId: string | undefined;
                let admission: string | undefined;
                if (raw.startsWith('RS1|')) {
                    const parsed = parseStandardQRPayload(raw);
                    targetId = parsed?.studentId;
                    admission = parsed?.admissionNo;
                    const sig = parsed?.signature;
                    if (sig) {
                        const core = raw.split('|').filter(p => !p.startsWith('SIG=')).join('|');
                        const ok = await apiVerifyQRSignature(core, sig);
                        if (!ok) { throw new Error('Invalid QR signature'); }
                    }
                } else {
                    admission = raw;
                }
                let student = targetId ? students.find(s => s.id === targetId) : undefined;
                if (!student && admission) student = students.find(s => s.admissionNo === admission);
                if (student) {
                    await handleStatusChange(student.id, 'present');
                    setQRScanOpen(false);
                    stopStream();
                } else {
                    throw new Error('No matching student found from payload');
                }
            } catch (e: any) {
                setError(e?.message || 'Failed to decode QR image');
            }
        };
        useEffect(() => {
            const start = async () => {
                try {
                    const isSecure = (typeof window !== 'undefined') && ((window as any).isSecureContext || location.protocol === 'https:' || ['localhost', '127.0.0.1'].includes(location.hostname));
                    if (!isSecure || !(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)) {
                        setError('Camera access is unavailable. Use HTTPS or localhost, or upload a QR image / use manual entry.');
                        return;
                    }
                    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        await videoRef.current.play();
                    }
                    const Detector = (window as any).BarcodeDetector;
                    const BarcodeDetectorCtor = (window as any).BarcodeDetector;
                    let detector: any = null;
                    if (!BarcodeDetectorCtor) {
                        // Fallback: use jsQR from canvas snapshots
                        try { await ensureJsQRLoaded(); } catch (e: any) { setError(e.message); }
                    } else {
                        detector = new BarcodeDetectorCtor({ formats: ['qr_code'] });
                    }
                    setScanning(true);
                    const loop = async () => {
                        if (!scanning || !videoRef.current) return;
                        try {
                            let raw = '';
                            if (detector) {
                                const detections = await detector.detect(videoRef.current);
                                if (detections && detections.length > 0) raw = detections[0].rawValue || '';
                            } else {
                                const v = videoRef.current;
                                const w = v.videoWidth || 640, h = v.videoHeight || 480;
                                const canvas = canvasRef.current;
                                canvas.width = w; canvas.height = h;
                                const ctx = canvas.getContext('2d');
                                if (ctx) {
                                    ctx.drawImage(v, 0, 0, w, h);
                                    const imageData = ctx.getImageData(0, 0, w, h);
                                    const code = (window as any).jsQR(imageData.data, w, h);
                                    if (code && code.data) raw = code.data;
                                }
                            }
                            if (raw) {
                                let targetId: string | undefined;
                                let admission: string | undefined;
                                if (raw.startsWith('RS1|')) {
                                    const parsed = parseStandardQRPayload(raw);
                                    targetId = parsed?.studentId;
                                    admission = parsed?.admissionNo;
                                    const sig = parsed?.signature;
                                    if (sig) {
                                        const core = raw.split('|').filter(p => !p.startsWith('SIG=')).join('|');
                                        const ok = await apiVerifyQRSignature(core, sig);
                                        if (!ok) { setError('Invalid QR signature.'); }
                                    }
                                } else {
                                    admission = raw;
                                }
                                let student = targetId ? students.find(s => s.id === targetId) : undefined;
                                if (!student && admission) student = students.find(s => s.admissionNo === admission);
                                if (student) {
                                    await handleStatusChange(student.id, 'present');
                                    setQRScanOpen(false);
                                    stopStream();
                                    return;
                                }
                            }
                        } catch (e) {
                            // ignore frame errors
                        }
                        requestAnimationFrame(loop);
                    };
                    requestAnimationFrame(loop);
                } catch (e: any) {
                    setError(e?.message || 'Camera access error');
                }
            };
            start();
            return () => { setScanning(false); stopStream(); };
        }, []);

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg w-full max-w-md p-4">
                    <h3 className="text-lg font-semibold mb-2">Scan QR Code</h3>
                    {error ? <p className="text-sm text-red-600">{error}</p> : null}
                    <video ref={videoRef} className="w-full rounded-md bg-black" playsInline muted />
                    {error && (
                        <div className="mt-3 space-y-2">
                            <input type="file" accept="image/*" className="input-field w-full" onChange={e => {
                                const f = e.target.files && e.target.files[0];
                                if (f) decodeFromImageFile(f);
                            }} />
                            <div className="text-xs text-gray-500">Upload a photo of the QR code to decode.</div>
                            <div className="flex justify-between items-center">
                                <button className="btn btn-secondary" onClick={() => { setQRScanOpen(false); setQRModalOpen(true); }}>Use Manual Entry</button>
                            </div>
                        </div>
                    )}
                    <div className="flex justify-end gap-2 mt-3">
                        <button className="btn btn-secondary" onClick={() => { setQRScanOpen(false); }}>Close</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return <TableSkeleton cols={1} />;
        if (students.length === 0) {
            return <div className="mt-4"><EmptyState message={`No students found in ${selectedClass}.`} /></div>;
        }

        return (
             <div className="table-container">
                <table className="table">
                     <thead><tr><th className="th">Student Name</th><th className="th text-right">Status</th></tr></thead>
                     <tbody>
                        {students.map(student => (
                            <tr key={student.id}>
                                <td className="td font-medium">{student.name}</td>
                                <td className="td text-right"><StatusButton studentId={student.id} currentStatus={attendance[student.id]} /></td>
                            </tr>
                        ))}
                     </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Mark My Attendance</h2>
                    {role !== 'Teacher' ? (
                        <p className="text-sm text-gray-500">Only teachers can mark their own attendance.</p>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="btn" onClick={handleCaptureLocation} disabled={geoStatus === 'locating'}>
                                {geoStatus === 'locating' ? 'Locating…' : 'Capture Location'}
                            </button>
                            {reading && <span className="text-sm text-gray-600">Accuracy: {Math.round(reading.accuracy_m || 0)} m</span>}
                            {distanceInfo && <span className="text-sm text-gray-600">{distanceInfo}</span>}
                            {geoError && <span className="text-sm text-red-600">{geoError}</span>}
                            {geoStatus === 'inside' && (
                                ((settings?.geofenceRules?.requireTwoCaptures ?? false) ? (
                                    validCaptureCount >= 2 ? (
                                        <button className="btn btn-primary" onClick={handleConfirmPresent}>Confirm Present</button>
                                    ) : (
                                        <span className="text-sm text-gray-600">Capture again to confirm</span>
                                    )
                                ) : (
                                    <button className="btn btn-primary" onClick={handleConfirmPresent}>Confirm Present</button>
                                ))
                            )}
                            {(settings?.geofenceRules?.allowManualMarking ?? true) && (
                                <button className="btn btn-secondary" onClick={handleConfirmPresentManual}>Mark Present Manually</button>
                            )}
                            {geoStatus === 'outside' && (
                                <span className="text-red-600 text-sm">Outside premises or low accuracy</span>
                            )}
                            {geoStatus === 'saved' && (
                                <span className="text-green-600 text-sm">Attendance marked</span>
                            )}
                            {geoStatus === 'error' && (
                                <span className="text-red-600 text-sm">Unable to mark attendance</span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex gap-4 w-full md:w-auto">
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="input-field"/>
                        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="input-field">
                            {classNames.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                     <div className="flex gap-2">
                        <button onClick={() => markAll('present')} className="btn btn-secondary">Mark All Present</button>
                        <button onClick={() => markAll('absent')} className="btn btn-secondary">Mark All Absent</button>
                        <button onClick={() => setQRModalOpen(true)} className="btn btn-secondary">QR Attendance</button>
                        <button onClick={() => setQRScanOpen(true)} className="btn btn-secondary">Scan QR</button>
                        <button onClick={() => setFaceModalOpen(true)} className="btn btn-secondary">Facial Recognition</button>
                    </div>
                </div>
                {renderContent()}
                {isQRModalOpen && <QRModal />}
                {isQRScanOpen && <QRScannerModal />}
                {isFaceModalOpen && <FaceModal />}
            </div>
        </div>
    );
};

export default Attendance;
    useTeacherPresenceWatcher();

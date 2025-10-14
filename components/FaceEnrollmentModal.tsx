
import React, { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { apiUpsertStudent } from '../services/api';

// Augment the Window interface to declare 'faceapi' from the CDN-loaded script.
declare global {
    interface Window {
        faceapi: any;
    }
}

const FaceEnrollmentModal = ({ isOpen, onClose, student }) => {
    const videoRef = useRef(null);
    const [modelsLoaded, setModelsLoaded] = useState(false);
    const [captureStatus, setCaptureStatus] = useState('idle'); // idle, capturing, success, error
    const [cameraStatus, setCameraStatus] = useState('initializing'); // initializing, ready, error

    useEffect(() => {
        const loadModels = async () => {
            if (!window.faceapi) {
                console.error("face-api.js has not loaded. Face enrollment will be unavailable.");
                return;
            }
            const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights';
            await window.faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
            await window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
            await window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
            setModelsLoaded(true);
        };
        loadModels();
    }, []);

    useEffect(() => {
        if (isOpen && modelsLoaded) {
            startVideo();
        } else {
            stopVideo();
        }
        return () => stopVideo(); // Cleanup on unmount or when isOpen changes
    }, [isOpen, modelsLoaded]);
    
    const startVideo = () => {
        setCameraStatus('initializing');
        navigator.mediaDevices.getUserMedia({ video: {} })
            .then(stream => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    setCameraStatus('ready');
                }
            })
            .catch(err => {
                console.error("Error accessing camera: ", err);
                setCameraStatus('error');
            });
    };

    const stopVideo = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };
    
    const handleCapture = async () => {
        if (!videoRef.current || !window.faceapi) {
             setCaptureStatus('error');
             setTimeout(() => setCaptureStatus('idle'), 2000);
            return;
        }
        setCaptureStatus('capturing');
        
        const detections = await window.faceapi.detectSingleFace(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (detections) {
            await apiUpsertStudent({
                ...student,
                faceDescriptor: Array.from(detections.descriptor)
            });
            
            setCaptureStatus('success');
            setTimeout(() => {
                onClose();
                setCaptureStatus('idle');
            }, 1500);
        } else {
            setCaptureStatus('error');
            setTimeout(() => setCaptureStatus('idle'), 2000);
        }
    };

    const renderCameraView = () => {
        if (cameraStatus === 'initializing') {
            return <div className="flex items-center justify-center h-full text-white"><p>Starting camera...</p></div>;
        }
        if (cameraStatus === 'error') {
            return (
                <div className="flex flex-col items-center justify-center h-full text-red-400 p-4">
                    <p className="font-semibold">Camera Access Denied</p>
                    <p className="text-sm mt-1 text-gray-300">Please enable camera permissions in your browser settings to use this feature.</p>
                </div>
            );
        }
        return <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover"></video>;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Face Enrollment for ${student?.name}`}>
            <div className="p-6 text-center">
                {!modelsLoaded ? <p>Loading AI models...</p> :
                <>
                    <div className="w-full bg-black rounded-lg overflow-hidden aspect-video mx-auto flex items-center justify-center">
                        {renderCameraView()}
                    </div>
                    <p className="mt-4 text-gray-600">
                        Please look directly at the camera and ensure your face is well-lit.
                    </p>
                    <button onClick={handleCapture} disabled={captureStatus !== 'idle' || cameraStatus !== 'ready'} className="mt-4 btn btn-primary">
                        {captureStatus === 'idle' && 'Capture Photo'}
                        {captureStatus === 'capturing' && 'Analyzing...'}
                        {captureStatus === 'success' && 'Success!'}
                        {captureStatus === 'error' && 'No face detected. Try again.'}
                    </button>
                </>
                }
            </div>
        </Modal>
    );
};

export default FaceEnrollmentModal;

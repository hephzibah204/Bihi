import React, { useCallback, useEffect, useRef, useState } from 'react';
import PermissionGuideModal from './PermissionGuideModal';
import MicrophoneIcon from './icons/MicrophoneIcon';
import { logger } from '../utils/logger';

type Status = 'idle' | 'requesting' | 'ready' | 'error';

const LiveTutor: React.FC = () => {
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPermissionGuide, setShowPermissionGuide] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const checkSecureContext = useCallback(() => {
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      // Many browsers require HTTPS for microphone
      setErrorMessage('Microphone requires a secure (HTTPS) context. Please use https or localhost.');
      setStatus('error');
      return false;
    }
    return true;
  }, []);

  const requestMicrophone = useCallback(async () => {
    setErrorMessage(null);
    setShowPermissionGuide(false);
    if (!checkSecureContext()) return;

    setStatus('requesting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setStatus('ready');
    } catch (err) {
      const e = err as DOMException;
      logger.captureError(e, 'LiveTutor microphone error');

      // Handle common permission/availability errors
      if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) {
        setErrorMessage('Microphone access denied. Please allow it in your browser settings.');
        setShowPermissionGuide(true);
      } else if (e && e.name === 'NotFoundError') {
        setErrorMessage('No microphone found. Please connect a microphone and try again.');
      } else if (e && e.name === 'NotReadableError') {
        setErrorMessage('Your microphone is currently in use by another application. Close it and retry.');
      } else if (e && e.name === 'AbortError') {
        setErrorMessage('Microphone request dismissed. Please try again and click Allow.');
      } else {
        setErrorMessage('Failed to access microphone. Please check browser permissions and try again.');
      }
      setStatus('error');
    }
  }, [checkSecureContext]);

  const stopMicrophone = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach(t => t.stop());
    } catch (e) {
      logger.captureError(e as any, 'Failed to stop microphone stream');
    }
    streamRef.current = null;
    setStatus('idle');
  }, []);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      try { streamRef.current?.getTracks().forEach(t => t.stop()); } catch { /* ignore */ }
      streamRef.current = null;
    };
  }, []);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Live Tutor</h1>
      <p className="text-sm text-gray-600 mb-6">Speak with the AI tutor using your microphone.</p>

      {status === 'idle' && (
        <button
          onClick={requestMicrophone}
          className="btn btn-primary flex items-center"
        >
          <MicrophoneIcon className="w-5 h-5 mr-2" /> Request Microphone Access
        </button>
      )}

      {status === 'requesting' && (
        <div className="flex items-center text-indigo-600">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Requesting microphone permission...
        </div>
      )}

      {status === 'ready' && (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <p className="text-green-700">Microphone active. You can start speaking to the tutor.</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-secondary" onClick={stopMicrophone}>Stop</button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-3">
          <div className="p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-700">{errorMessage || 'Microphone error'}</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={requestMicrophone}><MicrophoneIcon className="w-5 h-5 mr-2" /> Try Again</button>
            <button className="btn" onClick={() => setShowPermissionGuide(true)}>How to allow microphone</button>
          </div>
        </div>
      )}

      <PermissionGuideModal isOpen={showPermissionGuide} onClose={() => setShowPermissionGuide(false)} permissionName="microphone" />
    </div>
  );
};

export default LiveTutor;
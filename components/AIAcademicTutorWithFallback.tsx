// components/AIAcademicTutorWithFallback.tsx
// Wrapper for AIAcademicTutor with automatic fallback to Web Speech API

import React, { useState, useEffect, useRef } from 'react';
import AIAcademicTutor from './AIAcademicTutor';
import { createVoiceTutorFallback, isFallbackAvailable, VoiceTranscript } from '../services/voiceTutorFallback';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';

interface Props {
    demoUserId?: string;
}

type FallbackAPI = {
    startListening: () => void;
    stopListening: () => void;
    stopSpeaking: () => void;
    cleanup: () => void;
};

const AIAcademicTutorWithFallback: React.FC<Props> = ({ demoUserId }) => {
    const [useGemini, setUseGemini] = useState(true);
    const [geminiError, setGeminiError] = useState<string | null>(null);
    const [fallbackActive, setFallbackActive] = useState(false);
    const [fallbackStatus, setFallbackStatus] = useState<'idle' | 'listening' | 'speaking' | 'error'>('idle');
    const [fallbackTranscripts, setFallbackTranscripts] = useState<VoiceTranscript[]>([]);
    const fallbackRef = useRef<FallbackAPI | null>(null);
    const transcriptsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [fallbackTranscripts]);

    // Initialize fallback system
    useEffect(() => {
        if (!fallbackActive) return;

        const fallback = createVoiceTutorFallback({
            autoSpeak: true,
            rate: 0.9,
            pitch: 1.0
        });

        fallback.onTranscript((transcript) => {
            setFallbackTranscripts(prev => {
                const newTranscripts = [...prev];
                const lastIndex = newTranscripts.length - 1;
                const last = newTranscripts[lastIndex];

                // Update existing transcript or add new one
                if (last && last.sender === transcript.sender && !last.isFinal) {
                    newTranscripts[lastIndex] = transcript;
                } else {
                    newTranscripts.push(transcript);
                }

                return newTranscripts;
            });
        });

        fallback.onStatusChange((status) => {
            setFallbackStatus(status);
        });

        fallbackRef.current = fallback;

        return () => {
            fallback.cleanup();
        };
    }, [fallbackActive]);

    const startFallbackSession = () => {
        if (!fallbackRef.current) return;
        
        setFallbackTranscripts([]);
        setFallbackStatus('listening');
        fallbackRef.current.startListening();
    };

    const stopFallbackSession = () => {
        if (!fallbackRef.current) return;
        
        fallbackRef.current.stopListening();
        fallbackRef.current.stopSpeaking();
        setFallbackStatus('idle');
    };


    const getStatusIndicator = () => {
        switch (fallbackStatus) {
            case 'listening':
                return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span>Listening... (Fallback Mode)</span>
                    </div>
                );
            case 'speaking':
                return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <div className="w-3 h-3 rounded-full bg-green-400 pulse-dot-animation"></div>
                        <span>Speaking... (Fallback Mode)</span>
                    </div>
                );
            case 'idle':
                return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span>Ready to start (Fallback Mode)</span>
                    </div>
                );
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span>Error</span>
                    </div>
                );
            default:
                return null;
        }
    };

    // If using Gemini, render original component
    if (useGemini && !fallbackActive) {
        return (
            <>
                {geminiError && (
                    <div className="max-w-3xl mx-auto mb-4">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <div className="flex items-start">
                                <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-yellow-800">
                                        Gemini Live API Unavailable
                                    </p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        {geminiError}
                                    </p>
                                    {isFallbackAvailable() && (
                                        <button
                                            onClick={() => {
                                                setUseGemini(false);
                                                setFallbackActive(true);
                                            }}
                                            className="mt-3 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded"
                                        >
                                            Switch to Fallback Mode
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <AIAcademicTutor demoUserId={demoUserId} />
            </>
        );
    }

    // Fallback mode UI
    return (
        <div className="h-full max-w-3xl mx-auto">
            <div className="text-center mb-6">
                <MicrophoneIcon className="w-12 h-12 mx-auto text-indigo-500" />
                <h1 className="text-2xl font-bold mt-2">AI Academic Tutor</h1>
                <p className="text-gray-500 mt-1">Voice learning mode (using browser speech API)</p>
            </div>

            {/* Fallback Notice */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <span className="text-blue-600 text-xl mr-3">ℹ️</span>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-blue-800">
                            Using Fallback Mode
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                            Gemini Live API is unavailable. Using browser's speech recognition and our AI templates instead.
                            Quality may be lower but functionality is maintained.
                        </p>
                        {geminiError && (
                            <p className="text-xs text-blue-600 mt-2">
                                Reason: {geminiError}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="card mb-6">
                <div className="p-4 border-t flex flex-col items-center gap-4">
                    <div className="h-6">{getStatusIndicator()}</div>
                    
                    {fallbackStatus === 'listening' || fallbackStatus === 'speaking' ? (
                        <button 
                            onClick={stopFallbackSession}
                            className="btn btn-secondary bg-red-100 text-red-700 hover:bg-red-200"
                        >
                            <StopIcon className="w-5 h-5 mr-2" /> 
                            End Session
                        </button>
                    ) : (
                        <button 
                            onClick={startFallbackSession}
                            className="btn btn-primary"
                            disabled={fallbackStatus !== 'idle'}
                        >
                            <MicrophoneIcon className="w-5 h-5 mr-2" /> 
                            Start Session
                        </button>
                    )}
                </div>
            </div>

            {/* Transcripts */}
            <div className="card flex-grow flex flex-col min-h-[400px]">
                <div className="p-4 border-b">
                    <h3 className="font-semibold">Live Conversation</h3>
                </div>
                <div className="p-6 flex-grow overflow-y-auto flex flex-col space-y-4">
                    {fallbackTranscripts.length === 0 && fallbackStatus !== 'error' && (
                        <p className="text-center text-gray-400 my-auto">
                            Click "Start Session" and begin speaking...
                        </p>
                    )}
                    
                    {fallbackTranscripts.map((t, i) => (
                        <div 
                            key={i} 
                            className={`flex items-end gap-3 ${
                                t.sender === 'user' ? 'justify-end' : 'justify-start'
                            }`}
                        >
                            {t.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                    <SparklesIcon className="w-5 h-5"/>
                                </div>
                            )}
                            <div 
                                className={`max-w-[80%] p-3 rounded-2xl ${
                                    t.sender === 'ai' 
                                        ? 'bg-gray-100 rounded-bl-lg' 
                                        : 'bg-indigo-500 text-white rounded-br-lg'
                                } ${!t.isFinal ? 'opacity-70' : ''}`}
                            >
                                <p className="text-sm">{t.text}</p>
                            </div>
                            {t.sender === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0">
                                    <UserCircleIcon className="w-6 h-6"/>
                                </div>
                            )}
                        </div>
                    ))}
                    <div ref={transcriptsEndRef}></div>
                </div>
            </div>

            {/* Switch back to Gemini button */}
            <div className="mt-4 text-center">
                <button
                    onClick={() => {
                        stopFallbackSession();
                        setFallbackActive(false);
                        setUseGemini(true);
                        setGeminiError(null);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                >
                    Try Gemini Live API again
                </button>
            </div>
        </div>
    );
};

export default AIAcademicTutorWithFallback;
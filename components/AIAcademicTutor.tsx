import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { supabase } from '../services/supabaseClient';

// --- Audio Helper Functions ---
function encode(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function decode(base64) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
async function decodeAudioData(data, ctx, sampleRate, numChannels) {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Component ---
const AIAcademicTutor = () => {
    const [sessionPromise, setSessionPromise] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, initializing, connecting, connected, error
    const [errorMessage, setErrorMessage] = useState('');
    const [transcripts, setTranscripts] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    
    const aiRef = useRef(null);
    const inputAudioContextRef = useRef(null);
    const outputAudioContextRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const mediaStreamSourceRef = useRef(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set());
    const streamRef = useRef(null);

    const transcriptsEndRef = useRef(null);
    useEffect(() => {
        transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);
    
    const cleanup = () => {
        if (sessionPromise) {
            sessionPromise.then(session => session.close()).catch(console.error);
            setSessionPromise(null);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if (mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
            inputAudioContextRef.current.close().catch(console.error);
            inputAudioContextRef.current = null;
        }
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
            outputAudioContextRef.current.close().catch(console.error);
            outputAudioContextRef.current = null;
        }
        setStatus('idle');
        setIsSpeaking(false);
    };

    useEffect(() => {
        const initialize = async () => {
            setStatus('initializing');
            setErrorMessage('');
            try {
                if (!supabase) throw new Error("Authentication service not available.");

                const { data: { session } } = await supabase.auth.getSession();
                const isDemo = sessionStorage.getItem('isDemoMode') === 'true';

                if (!session && !isDemo) throw new Error("User not authenticated.");

                const headers: HeadersInit = {};
                if (session) {
                    headers['Authorization'] = `Bearer ${session.access_token}`;
                } else if (isDemo) {
                    headers['X-Demo-Mode'] = 'true';
                }

                const response = await fetch('/api/ai/client-key', { headers });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch AI configuration from server.');
                }
                const { key } = await response.json();
                if (!key) throw new Error('Server did not provide an API key.');
                
                aiRef.current = new GoogleGenAI({ apiKey: key });
                setStatus('idle');
            } catch (e) {
                setErrorMessage(`AI Tutor is unavailable: ${e.message}`);
                setStatus('error');
            }
        };
        initialize();

        const handleBeforeUnload = (e) => {
            if (status === 'connected') {
                e.preventDefault();
                e.returnValue = 'You have an active AI Tutor session. Are you sure you want to leave?';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            cleanup();
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []); // Run only once on mount

    const startSession = async () => {
        if (status !== 'idle' || !aiRef.current) {
            return;
        }

        setStatus('connecting');
        setTranscripts([]);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            
            const promise = aiRef.current.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: async () => {
                        setStatus('connected');
                        mediaStreamSourceRef.current = inputAudioContextRef.current.createMediaStreamSource(stream);
                        scriptProcessorRef.current = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
                        
                        scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            promise.then((session) => {
                                if (session) session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message) => handleServerMessage(message),
                    onerror: (e) => {
                        console.error('Session error:', e);
                        setStatus('error');
                        setErrorMessage('A connection error occurred with the AI service.');
                        cleanup();
                    },
                    onclose: (e) => {
                        console.log('Session closed');
                        cleanup();
                    },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `You are to adopt the persona of a friendly, patient, and brilliant Nigerian academic tutor. Your primary audience is a secondary school student in Nigeria.

Your core mission is to provide clear, encouraging, and accurate academic help.

**Language Style:**
1.  **Foundation:** Your main language for explaining concepts, definitions, and formulas must be clear, standard English. This is crucial for academic clarity.
2.  **Nigerian Flavour:** To make the conversation feel natural and build rapport, you must sprinkle in common Nigerian English phrases and colloquialisms. Do this naturally, not forcefully.

**When to use Nigerian English:**
*   **Encouragement:** After a student shows understanding or makes an effort. Examples: "Ah, correct! Well done o!", "You're trying!", "E go soon clear, no worry."
*   **Checking Understanding:** Periodically check if the student is following. Examples: "Shey you understand now?", "You grab?", "Are we together on this?"
*   **Transitions & Starters:** Use them to start or move between parts of an explanation. Examples: "Oya, let's look at it this way...", "Ehen, so the next step is...", "Okay, see..."

**Tone and Demeanor:**
*   **Patient and Encouraging:** Never sound frustrated. Always be positive. If a student is wrong, gently correct them.
*   **Simplifier:** Break down complex topics into simple, relatable, step-by-step explanations.
*   **Focused:** Keep your answers concise and directly related to the student's question.

Example Interaction Flow:
Student: "I don't understand photosynthesis."
You: "Ah, no wahala, we go solve am together. Photosynthesis can sound complex, but it's just how plants make their own food. Let's break it down. The main things the plant needs are sunlight, water, and a gas called carbon dioxide. Shey you understand up to this point?"
`,
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                },
            });
            setSessionPromise(promise);

        } catch (err) {
            console.error("Microphone access denied:", err);
            setStatus('error');
            setErrorMessage('Microphone access was denied. Please allow microphone access to use the tutor.');
            cleanup();
        }
    };
    
    const handleServerMessage = async (message) => {
        const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
        if (audioData) {
            setIsSpeaking(true);
            const ctx = outputAudioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const audioBuffer = await decodeAudioData(decode(audioData), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(ctx.destination);
            source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) setIsSpeaking(false);
            });
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += audioBuffer.duration;
            audioSourcesRef.current.add(source);
        }
    
        setTranscripts(prev => {
            const newTranscripts = [...prev];
            const lastTranscript = newTranscripts[newTranscripts.length - 1];
    
            if (message.serverContent?.inputTranscription) {
                const text = message.serverContent.inputTranscription.text;
                if (lastTranscript && lastTranscript.sender === 'user' && !lastTranscript.isFinal) lastTranscript.text += text;
                else newTranscripts.push({ sender: 'user', text: text, isFinal: false });
            } else if (message.serverContent?.outputTranscription) {
                const text = message.serverContent.outputTranscription.text;
                if (lastTranscript && lastTranscript.sender === 'ai' && !lastTranscript.isFinal) lastTranscript.text += text;
                else newTranscripts.push({ sender: 'ai', text: text, isFinal: false });
            } else if (message.serverContent?.turnComplete) {
                if (lastTranscript) lastTranscript.isFinal = true;
            }
            return newTranscripts;
        });
    };
    
    const createBlob = (data) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
        return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
    };

    const getStatusIndicator = () => {
        switch (status) {
            case 'connected':
                return isSpeaking ? (
                    <div className="flex items-center gap-2 text-sm font-semibold text-green-600">
                        <div className="w-3 h-3 rounded-full bg-green-400 pulse-dot-animation"></div>
                        <span>Tutor is speaking...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-600">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                        <span>Listening...</span>
                    </div>
                );
            case 'connecting':
            case 'initializing':
                return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <SpinnerIcon className="w-4 h-4 animate-spin"/>
                        <span>{status === 'connecting' ? 'Connecting...' : 'Initializing...'}</span>
                    </div>
                );
            case 'idle':
                 return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span>Ready to start</span>
                    </div>
                 );
            case 'error':
                 return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-red-500">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <span>Error</span>
                    </div>
                 );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full max-w-3xl mx-auto gap-6">
            <div className="card text-center">
                <div className="p-6">
                    <HeadsetIcon className="w-12 h-12 mx-auto text-indigo-500" />
                    <h1 className="text-2xl font-bold mt-2">AI Academic Tutor</h1>
                    <p className="text-gray-500 mt-1">Have a real-time voice conversation with your personal AI tutor.</p>
                </div>

                <div className="p-4 border-t flex flex-col items-center gap-4">
                    <div className="h-6">{getStatusIndicator()}</div>
                    {errorMessage && <p className="text-sm text-red-600 max-w-md">{errorMessage}</p>}

                    {status === 'connected' || status === 'connecting' ? (
                        <button onClick={cleanup} className="btn btn-secondary bg-red-100 text-red-700 hover:bg-red-200"><StopIcon className="w-5 h-5 mr-2" /> End Session</button>
                    ) : (
                        <button onClick={startSession} className="btn btn-primary" disabled={status !== 'idle'}>
                            <MicrophoneIcon className="w-5 h-5 mr-2" /> Start Session
                        </button>
                    )}
                </div>
            </div>

            <div className="card flex-grow flex flex-col min-h-0">
                <div className="p-4 border-b">
                     <h3 className="font-semibold">Live Transcription</h3>
                </div>
                <div className="p-6 flex-grow overflow-y-auto flex flex-col space-y-4">
                    {transcripts.length === 0 && status !== 'error' && <p className="text-center text-gray-400 my-auto">Your conversation will appear here...</p>}
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex items-end gap-3 ${t.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {t.sender === 'ai' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                    <SparklesIcon className="w-5 h-5"/>
                                </div>
                            )}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${t.sender === 'ai' ? 'bg-gray-100 rounded-bl-lg' : 'bg-indigo-500 text-white rounded-br-lg'} ${!t.isFinal ? 'opacity-70' : ''}`}>
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
        </div>
    );
};

export default AIAcademicTutor;
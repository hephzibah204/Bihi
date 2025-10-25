import React, { useState, useEffect, useRef, lazy, Suspense, PropsWithChildren } from 'react';
import { GoogleGenAI, Modality, FunctionDeclaration, Type } from '@google/genai';
import MicrophoneIcon from './icons/MicrophoneIcon';
import StopIcon from './icons/StopIcon';
import HeadsetIcon from './icons/HeadsetIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { logger } from '../utils/logger';
import SparklesIcon from './icons/SparklesIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import { USER_ROLES } from '../utils/constants';
import { useAuth } from '../contexts/AuthContext';
import { getVoiceSessionService } from '../services/voiceSessionService';
import { getConversationService } from '../services/conversationService';

const PracticeQuiz = lazy(() => import('./PracticeQuiz'));
const LearningPathways = lazy(() => import('./LearningPathways'));

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

// --- Function Declarations for AI ---
const generateQuizFunction: FunctionDeclaration = {
  name: 'generateQuiz',
  parameters: {
    type: Type.OBJECT,
    description: 'Generates a practice quiz for the student on a specific topic.',
    properties: {
      topic: { type: Type.STRING, description: 'The topic for the quiz.' },
      numQuestions: { type: Type.NUMBER, description: 'The number of questions to generate, defaults to 5.' },
    },
    required: ['topic'],
  },
};

const createLearningPathwayFunction: FunctionDeclaration = {
    name: 'createLearningPathway',
    parameters: {
        type: Type.OBJECT,
        description: 'Creates a personalized, step-by-step learning plan for a student to master a topic.',
        properties: {
            topic: { type: Type.STRING, description: 'The topic the student wants to learn.' },
            learningStyle: { type: Type.STRING, description: 'The student\'s preferred learning style (e.g., Visual, Practical). Defaults to Balanced.' },
        },
        required: ['topic'],
    },
};


const VoiceTutorUI = ({ startSession, cleanup, status, isSpeaking, errorMessage, transcripts }) => {
    const transcriptsEndRef = useRef(null);
    useEffect(() => {
        transcriptsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);

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
            case 'connecting': case 'initializing':
                return (
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-500">
                        <SpinnerIcon className="w-4 h-4 animate-spin"/>
                        <span>{status === 'connecting' ? 'Connecting...' : 'Initializing...'}</span>
                    </div>
                );
            case 'idle':
                 return <div className="flex items-center gap-2 text-sm font-semibold text-gray-500"><div className="w-3 h-3 rounded-full bg-gray-400"></div><span>Ready to start</span></div>;
            case 'error':
                 return <div className="flex items-center gap-2 text-sm font-semibold text-red-500"><div className="w-3 h-3 rounded-full bg-red-400"></div><span>Error</span></div>;
            default: return null;
        }
    };

    return (
        <div className="flex flex-col h-full gap-6">
            <div className="card text-center">
                <div className="p-4 border-t flex flex-col items-center gap-4">
                    <div className="h-6">{getStatusIndicator()}</div>
                    {errorMessage && <p className="text-sm text-red-600 max-w-md">{errorMessage}</p>}
                    {status === 'connected' || status === 'connecting' ? (
                        <button onClick={cleanup} className="btn btn-secondary bg-red-100 text-red-700 hover:bg-red-200"><StopIcon className="w-5 h-5 mr-2" /> End Session</button>
                    ) : (
                        <button onClick={startSession} className="btn btn-primary" disabled={status !== 'idle'}><MicrophoneIcon className="w-5 h-5 mr-2" /> Start Session</button>
                    )}
                </div>
            </div>
            <div className="card flex-grow flex flex-col min-h-0">
                <div className="p-4 border-b"><h3 className="font-semibold">Live Transcription</h3></div>
                <div className="p-6 flex-grow overflow-y-auto flex flex-col space-y-4">
                    {transcripts.length === 0 && status !== 'error' && <p className="text-center text-gray-400 my-auto">Your conversation will appear here...</p>}
                    {transcripts.map((t, i) => (
                        <div key={i} className={`flex items-end gap-3 ${t.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {t.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 flex-shrink-0"><SparklesIcon className="w-5 h-5"/></div>}
                            <div className={`max-w-[80%] p-3 rounded-2xl ${t.sender === 'ai' ? 'bg-gray-100 rounded-bl-lg' : 'bg-indigo-500 text-white rounded-br-lg'} ${!t.isFinal ? 'opacity-70' : ''}`}>
                                <p className="text-sm">{t.text}</p>
                            </div>
                            {t.sender === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><UserCircleIcon className="w-6 h-6"/></div>}
                        </div>
                    ))}
                    <div ref={transcriptsEndRef}></div>
                </div>
            </div>
        </div>
    );
};


const AIAcademicTutor = ({ demoUserId }) => {
    const { session } = useAuth(); // Using the new centralized auth context
    const [activeTool, setActiveTool] = useState<'voice' | 'quiz' | 'pathway'>('voice');
    const [toolProps, setToolProps] = useState<any>({});
    
    // Voice session state
    const [sessionPromise, setSessionPromise] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, initializing, connecting, connected, error
    const [errorMessage, setErrorMessage] = useState('');
    const [transcripts, setTranscripts] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [voiceSessionId, setVoiceSessionId] = useState<string | null>(null);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const sessionStartTimeRef = useRef<number>(0);
    
    const aiRef = useRef(null);
    const inputAudioContextRef = useRef(null);
    const outputAudioContextRef = useRef(null);
    const scriptProcessorRef = useRef(null);
    const mediaStreamSourceRef = useRef(null);
    const nextStartTimeRef = useRef(0);
    const audioSourcesRef = useRef(new Set());
    const streamRef = useRef(null);

    const cleanup = async () => {
        // Save voice session before cleanup
        if (voiceSessionId && transcripts.length > 0) {
            try {
                const duration = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
                const voiceService = getVoiceSessionService();
                await voiceService.endSession(voiceSessionId, transcripts, duration);
                
                // Optionally sync to conversation
                if (conversationId) {
                    await voiceService.syncToConversation(voiceSessionId);
                }
                
                logger.info('Voice session saved', { voiceSessionId });
            } catch (error) {
                logger.error('Failed to save voice session', { error: error as any });
            }
        }
        
        if (sessionPromise) {
            sessionPromise.then(session => session.close()).catch(console.error);
            setSessionPromise(null);
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
        if (mediaStreamSourceRef.current) mediaStreamSourceRef.current.disconnect();
        if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') inputAudioContextRef.current.close().catch(console.error);
        if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') outputAudioContextRef.current.close().catch(console.error);
        
        scriptProcessorRef.current = null;
        mediaStreamSourceRef.current = null;
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        setStatus('idle');
        setIsSpeaking(false);
        setVoiceSessionId(null);
    };

    useEffect(() => {
        const initialize = async () => {
            setStatus('initializing');
            setErrorMessage('');
            try {
                const isDemo = sessionStorage.getItem('isDemoMode') === 'true';
                if (!session && !isDemo) throw new Error("User not authenticated.");
                
                const headers: HeadersInit = {};
                if (isDemo) headers['X-Demo-Mode'] = 'true';
                else if (session) headers['Authorization'] = `Bearer ${session.access_token}`;

                const response = await fetch('/api/ai/client-key', { headers });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to fetch AI configuration.');
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
        return () => { cleanupRef.current && cleanupRef.current(); }; // Full cleanup on component unmount
    }, [session]);

    const cleanupRef = useRef<() => void>(() => {});
    useEffect(() => {
        cleanupRef.current = () => { void cleanup(); };
    }, [cleanup]);

    const startSession = async () => {
        if (status !== 'idle' || !aiRef.current) return;
        setStatus('connecting');
        setTranscripts([]);
        sessionStartTimeRef.current = Date.now();
        
        // Create voice session and conversation
        try {
            const isDemo = sessionStorage.getItem('isDemoMode') === 'true';
            const userId = isDemo ? (demoUserId || 'demo-user') : session?.user?.id;
            
            if (userId) {
                // Create conversation first
                const conversationService = getConversationService();
                const conversation = await conversationService.createConversation({
                    userId,
                    title: 'Voice Tutor Session',
                    type: 'voice_tutor'
                });
                setConversationId(conversation.id);
                
                // Create voice session
                const voiceService = getVoiceSessionService();
                const voiceSession = await voiceService.createSession({
                    userId,
                    conversationId: conversation.id,
                    sessionType: 'gemini_live'
                });
                setVoiceSessionId(voiceSession.id);
                console.log('Voice session started:', voiceSession.id);
            }
        } catch (error) {
            logger.error('Failed to create voice session', { error: error as any });
            // Continue anyway - don't block user
        }
        
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
                        scriptProcessorRef.current.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            promise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                        };
                        mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
                        scriptProcessorRef.current.connect(inputAudioContextRef.current.destination);
                    },
                    onmessage: async (message) => handleServerMessage(message, promise),
                    onerror: (e) => { logger.error('Session error', { error: e as any }); setStatus('error'); setErrorMessage('Connection error.'); cleanup(); },
                    onclose: (e) => { logger.info('Session closed'); cleanup(); },
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: `You are a friendly Nigerian academic tutor for secondary school students. Your main language is clear English, but you must sprinkle in common Nigerian English phrases (like "Well done o!", "Shey you understand?", "No wahala") for encouragement and to build rapport. You have access to tools to generate quizzes and learning plans. When a user asks for one, use the appropriate tool.`,
                    outputAudioTranscription: {},
                    inputAudioTranscription: {},
                    tools: [{ functionDeclarations: [generateQuizFunction, createLearningPathwayFunction] }],
                },
            });
            setSessionPromise(promise);
        } catch (err) {
            setStatus('error');
            setErrorMessage('Microphone access denied. Please allow it in browser settings.');
            cleanup();
        }
    };
    
    const handleServerMessage = async (message, sessionPromise) => {
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
        
        if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              console.debug('Function call received:', fc);
              sessionPromise.then((session) => {
                session.sendToolResponse({
                  functionResponses: { id: fc.id, name: fc.name, response: { result: 'ok, switching view' } }
                });
              });
              switch (fc.name) {
                case 'generateQuiz':
                  setToolProps(fc.args);
                  setActiveTool('quiz');
                  cleanup();
                  break;
                case 'createLearningPathway':
                  setToolProps(fc.args);
                  setActiveTool('pathway');
                  cleanup();
                  break;
              }
            }
        }
    
        setTranscripts(prev => {
            const newTranscripts = [...prev];
            const last = newTranscripts[newTranscripts.length - 1];
            if (message.serverContent?.inputTranscription) {
                if (last?.sender === 'user' && !last.isFinal) last.text += message.serverContent.inputTranscription.text;
                else newTranscripts.push({ sender: 'user', text: message.serverContent.inputTranscription.text, isFinal: false });
            } else if (message.serverContent?.outputTranscription) {
                if (last?.sender === 'ai' && !last.isFinal) last.text += message.serverContent.outputTranscription.text;
                else newTranscripts.push({ sender: 'ai', text: message.serverContent.outputTranscription.text, isFinal: false });
            } else if (message.serverContent?.turnComplete && last) {
                last.isFinal = true;
            }
            return newTranscripts;
        });
    };
    
    const createBlob = (data) => {
        const l = data.length; const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
        return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
    };

    const ToolWrapper = ({ title, children, onBack }: PropsWithChildren<{ title: string; onBack: () => void }>) => (
        <div className="card h-full">
            <div className="p-4 border-b">
                <button onClick={onBack} className="btn btn-secondary mb-4">&larr; Back to Voice Tutor</button>
                <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <div className="p-6 overflow-y-auto">
                {children}
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTool) {
            case 'quiz':
                return (
                    <ToolWrapper title="Practice Quiz Generator" onBack={() => setActiveTool('voice')}>
                        <Suspense fallback={<SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/>}>
                            <PracticeQuiz userRole={USER_ROLES.STUDENT} studentId={demoUserId} initialTopic={toolProps.topic} />
                        </Suspense>
                    </ToolWrapper>
                );
            case 'pathway':
                return (
                    <ToolWrapper title="Personalized Learning Pathway" onBack={() => setActiveTool('voice')}>
                        <Suspense fallback={<SpinnerIcon className="w-8 h-8 animate-spin mx-auto"/>}>
                            <LearningPathways userRole={USER_ROLES.STUDENT} studentId={demoUserId} initialTopic={toolProps.topic} />
                        </Suspense>
                    </ToolWrapper>
                );
            case 'voice':
            default:
                return (
                    <VoiceTutorUI 
                        startSession={startSession} 
                        cleanup={cleanup} 
                        status={status} 
                        isSpeaking={isSpeaking} 
                        errorMessage={errorMessage} 
                        transcripts={transcripts}
                    />
                );
        }
    };

    return (
        <div className="h-full max-w-3xl mx-auto">
             <div className="text-center mb-6">
                <HeadsetIcon className="w-12 h-12 mx-auto text-indigo-500" />
                <h1 className="text-2xl font-bold mt-2">AI Academic Tutor</h1>
                <p className="text-gray-500 mt-1">Your personal AI learning companion. Ask questions, generate quizzes, and create study plans with your voice.</p>
            </div>
            {renderContent()}
        </div>
    );
};

export default AIAcademicTutor;

// services/voiceTutorFallback.ts
// Fallback system for voice tutor when Gemini Live API is unavailable

import { generateFallbackResponse } from './fallbackAiService';

export interface VoiceTutorFallbackConfig {
    useWebSpeechAPI: boolean;
    autoSpeak: boolean;
    voice?: string;
    rate?: number;
    pitch?: number;
}

export interface VoiceTranscript {
    sender: 'user' | 'ai';
    text: string;
    isFinal: boolean;
    timestamp: number;
}

/**
 * Voice Tutor Fallback System
 * Uses Web Speech API for voice recognition and synthesis
 * Uses our enhanced fallback AI for responses
 */
export class VoiceTutorFallback {
    private recognition: any = null;
    private synthesis: SpeechSynthesis | null = null;
    private isListening: boolean = false;
    private isSpeaking: boolean = false;
    private config: VoiceTutorFallbackConfig;
    private onTranscriptCallback: ((transcript: VoiceTranscript) => void) | null = null;
    private onStatusChangeCallback: ((status: 'listening' | 'speaking' | 'idle' | 'error') => void) | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;

    constructor(config: Partial<VoiceTutorFallbackConfig> = {}) {
        this.config = {
            useWebSpeechAPI: true,
            autoSpeak: true,
            voice: 'en-NG', // Nigerian English
            rate: 0.9,
            pitch: 1.0,
            ...config
        };

        this.initializeWebSpeechAPI();
    }

    /**
     * Initialize Web Speech API for voice recognition
     */
    private initializeWebSpeechAPI() {
        if (typeof window === 'undefined') return;

        // Check for Speech Recognition support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-NG'; // Nigerian English

            this.recognition.onstart = () => {
                console.log('🎤 Voice recognition started (fallback mode)');
                this.isListening = true;
                this.onStatusChangeCallback?.('listening');
            };

            this.recognition.onresult = (event: any) => {
                const results = event.results;
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < results.length; i++) {
                    const transcript = results[i][0].transcript;
                    if (results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (interimTranscript) {
                    this.onTranscriptCallback?.({
                        sender: 'user',
                        text: interimTranscript,
                        isFinal: false,
                        timestamp: Date.now()
                    });
                }

                if (finalTranscript) {
                    this.onTranscriptCallback?.({
                        sender: 'user',
                        text: finalTranscript,
                        isFinal: true,
                        timestamp: Date.now()
                    });

                    // Process the question
                    this.processUserInput(finalTranscript);
                }
            };

            this.recognition.onerror = (event: any) => {
                console.error('Voice recognition error:', event.error);
                this.onStatusChangeCallback?.('error');
            };

            this.recognition.onend = () => {
                console.log('Voice recognition ended');
                if (this.isListening) {
                    // Restart if we're still supposed to be listening
                    this.recognition.start();
                }
            };
        }

        // Check for Speech Synthesis support
        if ('speechSynthesis' in window) {
            this.synthesis = window.speechSynthesis;
        }
    }

    /**
     * Start listening to user's voice
     */
    public startListening() {
        if (!this.recognition) {
            throw new Error('Web Speech API not supported in this browser');
        }

        if (!this.isListening) {
            this.isListening = true;
            this.recognition.start();
        }
    }

    /**
     * Stop listening
     */
    public stopListening() {
        if (this.recognition && this.isListening) {
            this.isListening = false;
            this.recognition.stop();
            this.onStatusChangeCallback?.('idle');
        }
    }

    /**
     * Process user input and generate AI response
     */
    private async processUserInput(userText: string) {
        try {
            console.log('Processing user input:', userText);
            this.onStatusChangeCallback?.('speaking');

            // Use our enhanced fallback AI system
            const aiResponse = generateFallbackResponse({
                prompt: userText,
                context: {
                    userRole: 'Student',
                    conversational: true,
                    voiceMode: true
                }
            });

            // Add AI transcript
            this.onTranscriptCallback?.({
                sender: 'ai',
                text: aiResponse,
                isFinal: true,
                timestamp: Date.now()
            });

            // Speak the response if autoSpeak is enabled
            if (this.config.autoSpeak) {
                await this.speak(aiResponse);
            }

            this.onStatusChangeCallback?.('listening');
        } catch (error) {
            console.error('Error processing user input:', error);
            this.onStatusChangeCallback?.('error');
            
            // Speak error message
            await this.speak("Sorry, I had trouble processing that. Could you please repeat?");
        }
    }

    /**
     * Speak text using Web Speech Synthesis API
     */
    public speak(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.synthesis) {
                reject(new Error('Speech synthesis not supported'));
                return;
            }

            // Stop any ongoing speech
            if (this.isSpeaking) {
                this.synthesis.cancel();
            }

            const utterance = new SpeechSynthesisUtterance(text);
            this.currentUtterance = utterance;

            // Configure voice
            utterance.rate = this.config.rate || 0.9;
            utterance.pitch = this.config.pitch || 1.0;

            // Try to find Nigerian English voice
            const voices = this.synthesis.getVoices();
            const nigerianVoice = voices.find(v => 
                v.lang.includes('en-NG') || 
                v.lang.includes('en-GB') || 
                v.name.includes('English')
            );
            
            if (nigerianVoice) {
                utterance.voice = nigerianVoice;
            }

            utterance.onstart = () => {
                console.log('🔊 Speaking...');
                this.isSpeaking = true;
                this.onStatusChangeCallback?.('speaking');
            };

            utterance.onend = () => {
                console.log('Speaking ended');
                this.isSpeaking = false;
                this.currentUtterance = null;
                this.onStatusChangeCallback?.('listening');
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                this.currentUtterance = null;
                reject(event.error);
            };

            this.synthesis.speak(utterance);
        });
    }

    /**
     * Stop speaking
     */
    public stopSpeaking() {
        if (this.synthesis && this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.onStatusChangeCallback?.('listening');
        }
    }

    /**
     * Set callback for transcript updates
     */
    public onTranscript(callback: (transcript: VoiceTranscript) => void) {
        this.onTranscriptCallback = callback;
    }

    /**
     * Set callback for status changes
     */
    public onStatusChange(callback: (status: 'listening' | 'speaking' | 'idle' | 'error') => void) {
        this.onStatusChangeCallback = callback;
    }

    /**
     * Check if browser supports the fallback features
     */
    public static isSupported(): {
        recognition: boolean;
        synthesis: boolean;
        fullSupport: boolean;
    } {
        const hasRecognition = typeof window !== 'undefined' && (
            'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
        );
        const hasSynthesis = typeof window !== 'undefined' && 'speechSynthesis' in window;

        return {
            recognition: hasRecognition,
            synthesis: hasSynthesis,
            fullSupport: hasRecognition && hasSynthesis
        };
    }

    /**
     * Get available voices
     */
    public getAvailableVoices(): SpeechSynthesisVoice[] {
        if (!this.synthesis) return [];
        return this.synthesis.getVoices();
    }

    /**
     * Cleanup resources
     */
    public cleanup() {
        this.stopListening();
        this.stopSpeaking();
        this.onTranscriptCallback = null;
        this.onStatusChangeCallback = null;
    }
}

/**
 * Factory function to create fallback instance
 */
export function createVoiceTutorFallback(config?: Partial<VoiceTutorFallbackConfig>): VoiceTutorFallback {
    return new VoiceTutorFallback(config);
}

/**
 * Check if fallback is available
 */
export function isFallbackAvailable(): boolean {
    const support = VoiceTutorFallback.isSupported();
    return support.fullSupport;
}

/**
 * Get fallback capabilities
 */
export function getFallbackCapabilities() {
    const support = VoiceTutorFallback.isSupported();
    
    return {
        available: support.fullSupport,
        features: {
            voiceRecognition: support.recognition,
            textToSpeech: support.synthesis,
            offlineAI: true, // We have offline fallback templates
            semanticCache: true // We have semantic caching
        },
        limitations: [
            !support.recognition && 'Voice recognition not supported in this browser',
            !support.synthesis && 'Text-to-speech not supported in this browser',
            'Responses generated using offline AI templates',
            'Quality may be lower than Gemini Live API'
        ].filter(Boolean)
    };
}
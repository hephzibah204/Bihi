import React, { useState } from 'react';
import { useAI } from './hooks/useAI';
import SparklesIcon from './components/icons/SparklesIcon';
import SpinnerIcon from './components/icons/SpinnerIcon';
import { generateResponse as aiGenerateResponse } from './services/geminiAIService';

interface AIAnnouncementGeneratorProps {
    onUseMessage: (message: string) => void;
}

const AIAnnouncementGenerator: React.FC<AIAnnouncementGeneratorProps> = ({ onUseMessage }) => {
    const [topic, setTopic] = useState('');
    const [tone, setTone] = useState('Formal');
    const [generatedMessage, setGeneratedMessage] = useState('');
    const { generateResponse, status } = useAI();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic) {
            setError('Please enter a topic for the announcement.');
            return;
        }
        setIsLoading(true);
        setError('');
        setGeneratedMessage('');

        try {
            const prompt = `
                You are a school administrator crafting an announcement for parents.
                Based on the topic provided, write a clear, concise, and professional announcement message suitable for SMS or email.
                
                **Topic:** "${topic}"
                **Tone:** "${tone}"

                The message should be well-structured and easy to understand.
            `;
            const result = await aiGenerateResponse(prompt);
            setGeneratedMessage(String(result));
        } catch (err) {
            const msg = (err as any)?.message || String(err);
            setError(`Failed to generate announcement: ${msg}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleUse = () => {
        if (generatedMessage) {
            onUseMessage(generatedMessage);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                 <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold">AI Announcement Generator</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Let AI help you write the perfect announcement.
                        </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                        {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>

                <div className="mt-4 space-y-4">
                    <div>
                        <label className="label">Announcement Topic</label>
                        <input
                            type="text"
                            className="input-field"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Mid-term break starts Friday, PTA meeting next week"
                        />
                    </div>
                    <div>
                        <label className="label">Tone</label>
                        <select className="input-field" value={tone} onChange={(e) => setTone(e.target.value)}>
                            <option>Formal</option>
                            <option>Friendly</option>
                            <option>Urgent</option>
                        </select>
                    </div>
                </div>

                <div className="mt-4">
                    <button onClick={handleGenerate} className="btn btn-primary" disabled={isLoading || !topic}>
                        {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                        <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Announcement'}</span>
                    </button>
                </div>
                
                {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

                {generatedMessage && (
                    <div className="mt-6 border-t pt-4">
                        <label className="label">Generated Message</label>
                        <textarea
                            className="input-field w-full"
                            rows={7}
                            value={generatedMessage}
                            readOnly
                        />
                        <div className="mt-2 text-right">
                             <button onClick={handleUse} className="btn btn-secondary">
                                Use This Message
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnnouncementGenerator;

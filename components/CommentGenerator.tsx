import React, { useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useAI } from '../hooks/useAI';

const CommentGenerator = () => {
    const [studentInfo, setStudentInfo] = useState('');
    const [generatedComment, setGeneratedComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { generateResponse, status } = useAI();

    const handleGenerate = async () => {
        if (!studentInfo) return;
        setIsLoading(true);
        setGeneratedComment('');
        
        try {
            const prompt = `Generate a constructive and encouraging report card comment (2-3 sentences) for a student based on the following performance summary: "${studentInfo}"`;
            const comment = await generateResponse({ prompt, context: { userRole: 'Teacher' } });
            setGeneratedComment(comment);
        } catch (error) {
            console.error("Failed to generate comment:", error);
            setGeneratedComment(`Sorry, an error occurred: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-semibold">AI Comment Generator</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Enter a student's performance summary to get a personalized comment.
                        </p>
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                         <span className={`w-2 h-2 rounded-full mr-2 ${status === 'gemini' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                         {status === 'gemini' ? 'Online' : 'Offline'}
                    </div>
                </div>
                <div className="mt-4">
                    <textarea
                        className="input-field"
                        rows={3}
                        value={studentInfo}
                        onChange={(e) => setStudentInfo(e.target.value)}
                        placeholder="e.g., Excels in creative writing, but needs to show workings in mathematics..."
                    />
                </div>
                <button onClick={handleGenerate} className="btn btn-primary mt-2" disabled={isLoading || !studentInfo}>
                    {isLoading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <SparklesIcon className="w-5 h-5" />}
                    <span className="ml-2">{isLoading ? 'Generating...' : 'Generate Comment'}</span>
                </button>
                {generatedComment && (
                    <div className="mt-4 p-4 bg-gray-100 rounded-md">
                        <h4 className="font-semibold text-sm">Suggested Comment:</h4>
                        <p className="mt-1 text-gray-800">{generatedComment}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentGenerator;

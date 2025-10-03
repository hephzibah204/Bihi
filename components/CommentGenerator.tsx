import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';
import SpinnerIcon from './icons/SpinnerIcon';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { generateFallbackComment } from '../services/fallbackAiService';

const CommentGenerator = () => {
    const [studentInfo, setStudentInfo] = useState('');
    const [generatedComment, setGeneratedComment] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const isOnline = useOnlineStatus();

    const handleGenerate = async () => {
        if (!studentInfo) return;
        setIsLoading(true);
        setGeneratedComment('');
        
        try {
            let comment;
            const prompt = `Generate a constructive and encouraging report card comment (2-3 sentences) for a student based on the following performance summary: "${studentInfo}"`;

            if (isOnline) {
                comment = await generateText(prompt);
            } else {
                comment = generateFallbackComment({ studentName: 'The student', performanceSummary: studentInfo });
            }
            setGeneratedComment(comment);
        } catch (error) {
            console.error("Failed to generate comment:", error);
            setGeneratedComment("Sorry, I couldn't generate a comment right now. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Comment Generator</h2>
                <p className="mt-2 text-sm text-gray-500">
                    Enter a student's performance summary (e.g., "Good in maths, struggles with reading comprehension") to get a personalized comment.
                </p>
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
                    <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <h4 className="font-semibold text-sm">Suggested Comment:</h4>
                        <p className="mt-1 text-gray-800 dark:text-gray-200">{generatedComment}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentGenerator;

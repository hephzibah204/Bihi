import React, { useState } from 'react';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

const CommentGenerator = () => {
    const [studentName, setStudentName] = useState('');
    const [performance, setPerformance] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        if (!studentName || !performance) {
            alert("Please enter both student name and performance summary.");
            return;
        }
        setLoading(true);
        setComment('');

        const prompt = `
            You are a helpful assistant for a teacher in a Nigerian school.
            Generate a constructive and encouraging report card comment for a student.
            The comment should be about 2-3 sentences long.

            Student's Name: ${studentName}
            Performance Summary: ${performance}

            Generate the comment now.
        `;

        const generatedComment = await generateText(prompt);
        setComment(generatedComment);
        setLoading(false);
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Report Card Comment Generator</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="label">Student Name</label>
                        <input type="text" className="input-field" value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="e.g., Adebayo Chinedu" />
                    </div>
                    <div>
                        <label className="label">Performance Summary</label>
                        <input type="text" className="input-field" value={performance} onChange={e => setPerformance(e.target.value)} placeholder="e.g., Excellent in Maths, struggles with English grammar" />
                    </div>
                </div>
                <div className="mt-4">
                     <button onClick={handleGenerate} className="btn btn-primary" disabled={loading}>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {loading ? 'Generating...' : 'Generate Comment'}
                    </button>
                </div>
                
                {comment && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold">Generated Comment:</h3>
                        <p className="mt-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-md">{comment}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommentGenerator;

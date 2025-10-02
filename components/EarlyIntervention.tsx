import React, { useState, useEffect } from 'react';
import { apiGetScores, apiGetStudents, apiGetSubjects } from '../services/api';
import { generateText } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

const EarlyIntervention = () => {
    const [analysis, setAnalysis] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleAnalysis = async () => {
        setLoading(true);
        setError('');
        setAnalysis('');
        try {
            const [scores, students, subjects] = await Promise.all([
                apiGetScores(),
                apiGetStudents(),
                apiGetSubjects()
            ]);

            if (scores.length === 0 || students.length === 0) {
                setAnalysis("Not enough data to perform analysis. Please add students and scores first.");
                setLoading(false);
                return;
            }

            // Simple preprocessing for the prompt
            const studentData = students.map(s => `ID: ${s.id}, Name: ${s.name}, Class: ${s.class}`).join('\n');
            const scoreData = scores.map(sc => {
                const subject = subjects.find(s => s.id === sc.subjectId);
                const total = (sc.ca1 || 0) + (sc.ca2 || 0) + (sc.exam || 0);
                return `Student ID: ${sc.studentId}, Subject: ${subject?.name}, Total: ${total}`;
            }).join('\n');
            
            const prompt = `
                You are an educational analyst AI for a Nigerian school. Your task is to identify students who might be at risk of failing based on their scores.
                
                Here is the data:
                Students:
                ${studentData}

                Scores:
                ${scoreData}

                Analysis Task:
                1. Identify students whose average score is below 45.
                2. For each identified student, list the subjects they are struggling with (scores below 40).
                3. Provide a brief, constructive recommendation for each student.
                4. If no students are at risk, state that clearly.

                Format your response in a clear, readable manner.
            `;

            const result = await generateText(prompt);
            setAnalysis(result);

        } catch (err) {
            setError("An error occurred while analyzing the data.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Early Intervention System</h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Identify students who may need extra academic support based on their current performance.</p>
                <div className="mt-4">
                    <button onClick={handleAnalysis} className="btn btn-primary" disabled={loading}>
                        <SparklesIcon className="w-5 h-5 mr-2" />
                        {loading ? 'Analyzing Data...' : 'Run Analysis'}
                    </button>
                </div>
                 {error && <div className="mt-4 text-red-500">{error}</div>}

                {analysis && (
                    <div className="mt-6 border-t pt-4">
                        <h3 className="text-lg font-semibold">Analysis Results</h3>
                        <div className="prose dark:prose-invert max-w-none mt-2 whitespace-pre-wrap">{analysis}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EarlyIntervention;

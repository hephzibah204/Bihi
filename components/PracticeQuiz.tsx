import React, { useState } from 'react';
import { generateText } from '../services/geminiService';

const PracticeQuiz = () => {
    const [topic, setTopic] = useState('');
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!topic) return;
        setLoading(true);
        setQuiz(null);
        setError('');
        const prompt = `Generate a 3-question multiple-choice quiz on the topic "${topic}". Format the output as a JSON array of objects, each with "question", "options" (an array of 4 strings), and "answer" (the correct option string).`;
        try {
            const response = await generateText(prompt);
            const jsonString = response.replace(/```json/g, "").replace(/```/g, "").trim();
            const jsonResponse = JSON.parse(jsonString);
            setQuiz(jsonResponse);
        } catch (e) {
            console.error("Failed to parse quiz JSON", e);
            setError("Sorry, the AI returned an unexpected format. Please try generating the quiz again.");
        }
        setLoading(false);
    };

    return (
        <div className="card">
            <div className="p-6">
                <h2 className="text-xl font-semibold">AI Practice Quiz</h2>
                <div className="flex gap-2 my-4">
                    <input 
                        type="text" 
                        value={topic}
                        onChange={e => setTopic(e.target.value)}
                        placeholder="Enter a topic (e.g., Photosynthesis)" 
                        className="input-field flex-1"
                    />
                    <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
                        {loading ? 'Generating...' : 'Generate Quiz'}
                    </button>
                </div>
                {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
                {quiz && (
                    <div className="space-y-4">
                        {quiz.map((q, i) => (
                            <div key={i}>
                                <p className="font-semibold">{i + 1}. {q.question}</p>
                                <div className="space-y-1 mt-2">
                                    {q.options.map(opt => <p key={opt} className="text-sm p-2 rounded bg-gray-100 dark:bg-gray-700">{opt}</p>)}
                                </div>
                                <p className="text-sm mt-1 text-green-600">Answer: {q.answer}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PracticeQuiz;
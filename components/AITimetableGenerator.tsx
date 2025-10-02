import React, { useState } from 'react';
import Modal from './Modal';
import { generateText } from '../services/geminiService';

const AITimetableGenerator = ({ isOpen, onClose, onApply, subjects, teachers, classes, timeSlots, days }) => {
    const [loading, setLoading] = useState(false);
    const [generatedJson, setGeneratedJson] = useState(null);
    const [error, setError] = useState('');

    const generateTimetable = async () => {
        setLoading(true);
        setError('');
        setGeneratedJson(null);

        const prompt = `
            You are a school timetable generator. Your task is to create a valid weekly timetable in JSON format.
            Here are the constraints and data:
            - School classes: ${classes.join(', ')}
            - Available subjects: ${subjects.map(s => `${s.name} (for classes: ${s.classes.join(', ')})`).join('; ')}
            - Available teachers: ${teachers.map(t => t.name).join(', ')}
            - Days of the week: ${days.join(', ')}
            - Time slots per day: ${timeSlots.join(', ')}

            Rules:
            1. A teacher cannot be in two different classes at the same time.
            2. Core subjects like Mathematics and English should be spread out and not clustered.
            3. No class should have the same subject twice in one day.
            4. Ensure every class has a schedule for every time slot on every day.
            5. Assign a valid teacher to each subject slot. The teacher does not have to be subject-specific for this task.

            Your output MUST be a JSON object with the following structure. Do not include any text or markdown formatting before or after the JSON object.
            The structure should be: { "className": { "day": { "timeSlot": { "subjectId": "...", "teacherId": "..." } } } }

            Here are the IDs to use:
            - Subject IDs: ${JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name })))}
            - Teacher IDs: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name })))}

            Now, generate the timetable.
        `;

        try {
            const response = await generateText(prompt);
            // Clean the response to ensure it's valid JSON
            const jsonString = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedJson = JSON.parse(jsonString);
            setGeneratedJson(parsedJson);
        } catch (err) {
            console.error("AI generation or parsing failed:", err);
            setError("Failed to generate a valid timetable. The AI's response was not in the correct format. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Timetable Generator" size="lg">
            <div className="p-6">
                <p className="text-gray-600 dark:text-gray-300">
                    Let AI create a balanced timetable for all classes based on your school's subjects and teachers. This process can take a minute.
                </p>
                <div className="mt-6 flex justify-center">
                    <button onClick={generateTimetable} className="btn btn-primary" disabled={loading}>
                        {loading ? 'Generating...' : '✨ Generate New Timetable'}
                    </button>
                </div>
                
                {error && <div className="mt-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                {generatedJson && (
                    <div className="mt-6">
                        <h3 className="font-semibold">Generation Complete!</h3>
                        <p className="text-sm text-gray-500">Review the generated timetable below. Applying it will overwrite the current schedule.</p>
                        <div className="mt-4 max-h-64 overflow-y-auto bg-gray-100 dark:bg-gray-700 p-4 rounded-md">
                            <pre className="text-xs">{JSON.stringify(generatedJson, null, 2)}</pre>
                        </div>
                         <div className="mt-6 flex justify-end">
                            <button onClick={() => onApply(generatedJson)} className="btn btn-primary">
                                Apply Timetable
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AITimetableGenerator;

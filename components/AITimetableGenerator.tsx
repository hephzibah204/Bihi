import React, { useState } from 'react';
import Modal from './Modal';
import { generateText } from '../services/geminiService';
import SpinnerIcon from './icons/SpinnerIcon';
import BrainCircuitIcon from './icons/BrainCircuitIcon';

const AITimetableGenerator = ({ isOpen, onClose, onApply, subjects, teachers, classes, timeSlots, days }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [generatedTimetable, setGeneratedTimetable] = useState(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setIsLoading(true);
        setError('');
        setGeneratedTimetable(null);

        const prompt = `
            You are an AI assistant that creates a school timetable.
            Generate a JSON object representing a timetable. The top-level keys should be class names.
            Each class should have keys for each day of the week.
            Each day should have keys for each time slot, with a value of an object containing 'subjectId' and 'teacherId'.
            
            Constraints:
            - A teacher cannot be in two places at once.
            - A class cannot have two subjects at once.
            - Distribute core subjects like Mathematics and English across different days.

            Available Data:
            Classes: ${JSON.stringify(classes)}
            Subjects: ${JSON.stringify(subjects.map(s => ({ id: s.id, name: s.name, classes: s.classes })))}
            Teachers: ${JSON.stringify(teachers.map(t => ({ id: t.id, name: t.name })))}
            Days: ${JSON.stringify(days)}
            Time Slots: ${JSON.stringify(timeSlots)}

            Return ONLY the JSON object. Do not include any other text or markdown.
            Example for one class: { "JSS 1": { "Monday": { "8:00 - 9:00": { "subjectId": "subj_1", "teacherId": "teacher_1" } } } }
        `;

        try {
            const response = await generateText(prompt);
            const cleanedResponse = response.replace(/```json/g, '').replace(/```/g, '').trim();
            const parsedTimetable = JSON.parse(cleanedResponse);
            setGeneratedTimetable(parsedTimetable);
        } catch (e) {
            console.error("AI Timetable Generation Error:", e);
            setError(`Failed to generate timetable. ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AI Timetable Generator" size="lg">
            <div className="p-6">
                {error && <p className="text-red-500 mb-4">{error}</p>}

                {generatedTimetable ? (
                    <div>
                        <h3 className="font-semibold">Generated Timetable Preview</h3>
                        <p className="text-sm text-gray-500">Review the generated timetable. If it looks good, apply it.</p>
                        <div className="mt-4 p-4 bg-gray-100 dark:bg-gray-800 rounded max-h-96 overflow-auto">
                            <pre className="text-xs">{JSON.stringify(generatedTimetable, null, 2)}</pre>
                        </div>
                         <div className="flex justify-end gap-2 mt-6">
                            <button onClick={handleGenerate} className="btn btn-secondary">Regenerate</button>
                            <button onClick={() => onApply(generatedTimetable)} className="btn btn-primary">Apply Timetable</button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center">
                        <BrainCircuitIcon className="w-16 h-16 mx-auto text-indigo-500" />
                        <h3 className="text-lg font-semibold mt-4">Generate Timetable with AI</h3>
                        <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                            Let AI create an optimized timetable based on your school's classes, subjects, and teachers.
                            This process may take a moment.
                        </p>
                        <button onClick={handleGenerate} className="btn btn-primary mt-6" disabled={isLoading}>
                            {isLoading && <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />}
                            {isLoading ? 'Generating...' : 'Start Generation'}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AITimetableGenerator;
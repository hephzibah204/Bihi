import React from 'react';
import DocumentTextIcon from './icons/DocumentTextIcon';

const PracticeQuiz = () => {
    return (
        <div className="card opacity-50">
            <div className="p-6">
                <div className="flex items-center">
                    <DocumentTextIcon className="w-6 h-6 mr-3 text-green-500" />
                    <h2 className="text-xl font-semibold">AI Practice Quiz Generator</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Coming Soon: Instantly create practice quizzes on any topic to help students prepare for exams.
                </p>
            </div>
        </div>
    );
};

export default PracticeQuiz;

import React from 'react';
import AIAcademicTutor from './AIAcademicTutor';

// Fix: Added placeholder component content to make it a valid module.
const ParentTutor = () => {
    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">AI Academic Tutor for Your Child</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
                Help your child learn and practice with our AI-powered tutor.
            </p>
            <div className="mt-6">
                <AIAcademicTutor />
            </div>
        </div>
    );
};

export default ParentTutor;
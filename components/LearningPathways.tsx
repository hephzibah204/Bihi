import React from 'react';
import BeakerIcon from './icons/BeakerIcon';

const LearningPathways = () => {
    return (
        <div className="card opacity-50">
            <div className="p-6">
                 <div className="flex items-center">
                    <BeakerIcon className="w-6 h-6 mr-3 text-purple-500" />
                    <h2 className="text-xl font-semibold">AI Learning Pathways</h2>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Coming Soon: Generate personalized learning steps for students based on their strengths and weaknesses.
                </p>
            </div>
        </div>
    );
};

export default LearningPathways;

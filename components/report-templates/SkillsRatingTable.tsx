import React from 'react';

// Fix: Typed Star as a React.FC to ensure it correctly handles the `key` prop.
const Star: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg className={`w-3 h-3 ${filled ? 'text-gray-700' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" />
    </svg>
);

// Fix: Typed SkillsRatingTable as a React.FC to ensure it correctly handles the `key` prop when used in a map.
interface SkillsRatingTableProps {
    title: string;
    skills: { id: string, label: string }[];
    ratings: any;
}
const SkillsRatingTable: React.FC<SkillsRatingTableProps> = ({ title, skills, ratings }) => {
    if (!skills || skills.length === 0) {
        return null;
    }

    // A placeholder rating for visual purposes, as data entry isn't implemented yet.
    const placeholderRating = 3; 

    return (
        <div className="mt-4">
            <h3 className="font-bold text-md mb-2 border-b">{title}</h3>
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b">
                        <th className="text-left py-1 font-semibold">Skill</th>
                        <th className="text-right py-1 font-semibold">Rating (1-5)</th>
                    </tr>
                </thead>
                <tbody>
                    {skills.map(skill => (
                        <tr key={skill.id}>
                            <td className="py-1">{skill.label}</td>
                            <td className="py-1">
                                <div className="flex justify-end space-x-1">
                                    {/* In the future, this will use the 'ratings' prop. For now, it's a visual placeholder */}
                                    {[...Array(5)].map((_, i) => <Star key={i} filled={i < placeholderRating} />)}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SkillsRatingTable;

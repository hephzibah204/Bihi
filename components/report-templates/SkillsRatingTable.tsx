import React from 'react';
import { ReportCardSkill } from '../../types';

interface SkillsRatingTableProps {
    title: string;
    skills: ReportCardSkill[];
    ratings: Record<string, number>;
}

const SkillsRatingTable: React.FC<SkillsRatingTableProps> = ({ title, skills, ratings }) => {
    if (!skills || skills.length === 0) return null;

    return (
        <div className="w-full p-2">
            <table className="w-full text-xs">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-1 border text-left" colSpan={6}>{title}</th>
                    </tr>
                    <tr className="text-center">
                        <th className="p-1 border"></th>
                        <th className="p-1 border" title="Excellent">5</th>
                        <th className="p-1 border" title="Very Good">4</th>
                        <th className="p-1 border" title="Good">3</th>
                        <th className="p-1 border" title="Fair">2</th>
                        <th className="p-1 border" title="Poor">1</th>
                    </tr>
                </thead>
                <tbody>
                    {skills.map(skill => (
                        <tr key={skill.id}>
                            <td className="p-1 border">{skill.label}</td>
                            {[5, 4, 3, 2, 1].map(ratingValue => (
                                <td key={ratingValue} className="p-1 border text-center">
                                    {(ratings?.[skill.id] === ratingValue) ? '✓' : ''}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default SkillsRatingTable;

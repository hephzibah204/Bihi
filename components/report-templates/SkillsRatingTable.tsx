 import React from 'react';
import { ReportCardSkill } from '../../types';

interface SkillsRatingTableProps {
  title?: string;
  skills: ReportCardSkill[];
  ratings: Record<string, number>;
  compact?: boolean; // optional: tighter for A4
}

const SkillsRatingTable: React.FC<SkillsRatingTableProps> = ({
  title,
  skills,
  ratings,
  compact = false,
}) => {
  if (!skills || skills.length === 0) return null;

  const paddingCell = compact ? 'p-0.5' : 'p-1';
  const paddingWrapper = compact ? 'p-1' : 'p-2';
  const fontSize = compact ? 'text-[7px]' : 'text-xs';

  return (
    <div className={`w-full ${paddingWrapper}`}>
      <table className={`w-full border-collapse ${fontSize}`}>
        <thead>
          {title && (
            <tr className="bg-gray-100">
              <th
                className={`${paddingCell} border text-left font-semibold`}
                colSpan={6}
              >
                {title}
              </th>
            </tr>
          )}
          <tr className="text-center bg-gray-50">
            <th className={`${paddingCell} border text-left`} />
            {[5, 4, 3, 2, 1].map((value) => (
              <th
                key={value}
                className={`${paddingCell} border font-normal`}
                scope="col"
              >
                {value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const key = skill.id || skill.key || skill.label;
            const rating = ratings?.[skill.id] ?? ratings?.[key];
            return (
              <tr key={key}>
                <td className={`${paddingCell} border`} scope="row">
                  {skill.label}
                </td>
                {[5, 4, 3, 2, 1].map((value) => (
                  <td
                    key={value}
                    className={`${paddingCell} border text-center`}
                  >
                    {rating === value ? '✓' : ''}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default SkillsRatingTable;

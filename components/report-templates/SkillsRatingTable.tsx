import React from 'react';
import { ReportCardSkill } from '../../types';

interface SkillsRatingTableProps {
  title?: string;
  skills: ReportCardSkill[];
  ratings: Record<string, number>;
  compact?: boolean; // optional: for tight A4 layouts
}

const SkillsRatingTable: React.FC<SkillsRatingTableProps> = ({
  title,
  skills,
  ratings,
  compact = false,
}) => {
  if (!skills || skills.length === 0) return null;

  const pad = compact ? 'p-0.5' : 'p-1';
  const wrapPad = compact ? 'p-1' : 'p-2';
  const font = compact ? 'text-[7px]' : 'text-xs';

  return (
    <div className={`w-full ${wrapPad}`}>
      <table className={`w-full border-collapse ${font}`}>
        <thead>
          {title && (
            <tr className="bg-gray-100">
              <th
                className={`${pad} border text-left font-semibold`}
                colSpan={6}
              >
                {title}
              </th>
            </tr>
          )}
          <tr className="text-center bg-gray-50">
            <th className={`${pad} border text-left`} />
            {[5, 4, 3, 2, 1].map((value) => (
              <th
                key={value}
                className={`${pad} border font-normal`}
                scope="col"
                title={
                  value === 5
                    ? 'Excellent'
                    : value === 4
                    ? 'Very Good'
                    : value === 3
                    ? 'Good'
                    : value === 2
                    ? 'Fair'
                    : 'Poor'
                }
              >
                {value}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => {
            const key = skill.id || skill.key || skill.label;
            const rating =
              ratings?.[skill.id] ??
              ratings?.[key];

            return (
              <tr key={key}>
                <td className={`${pad} border`} scope="row">
                  {skill.label}
                </td>
                {[5, 4, 3, 2, 1].map((value) => (
                  <td
                    key={value}
                    className={`${pad} border text-center`}
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

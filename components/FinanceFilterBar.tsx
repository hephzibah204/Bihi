import React from 'react';

type FinanceFilterBarProps = {
  sessions: string[];
  terms: string[];
  valueSession: string;
  valueTerm: string;
  onChange: (session: string, term: string) => void;
  className?: string;
};

export default function FinanceFilterBar({
  sessions,
  terms,
  valueSession,
  valueTerm,
  onChange,
  className,
}: FinanceFilterBarProps) {
  return (
    <div
      className={[
        'flex items-center gap-3 px-3 py-2 rounded-md',
        'border border-gray-200 dark:border-gray-700',
        'bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm',
        'text-sm',
        className || '',
      ].join(' ')}
      aria-label="Session and Term filters"
    >
      <span className="font-medium text-gray-700 dark:text-gray-200">Filter:</span>

      <label className="flex items-center gap-2">
        <span className="text-gray-600 dark:text-gray-300">Session</span>
        <select
          className="h-9 w-40 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-2"
          value={valueSession}
          onChange={(e) => onChange(e.target.value, valueTerm)}
          aria-label="Select session"
        >
          {sessions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2">
        <span className="text-gray-600 dark:text-gray-300">Term</span>
        <select
          className="h-9 w-32 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-800 px-2"
          value={valueTerm}
          onChange={(e) => onChange(valueSession, e.target.value)}
          aria-label="Select term"
        >
          {terms.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
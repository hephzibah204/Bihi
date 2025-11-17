import React from 'react';

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

const CalendarMini: React.FC = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const days = getDaysInMonth(year, month);
  const today = now.getDate();
  const monthName = now.toLocaleString(undefined, { month: 'long' });
  const weeks: number[][] = [];
  let week: number[] = [];
  const startDay = new Date(year, month, 1).getDay();
  for (let i = 0; i < startDay; i++) week.push(0);
  for (let d = 1; d <= days; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(0); weeks.push(week); }

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-semibold">School Calendar</div>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <button className="toggle-pill">◀</button>
          <div>{monthName} {year}</div>
          <button className="toggle-pill">▶</button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {weeks.flatMap((w, wi) => w.map((d, di) => (
          <div key={`${wi}-${di}`} className={`h-8 rounded-lg flex items-center justify-center ${d === today ? 'bg-[var(--brand-color-primary)] text-white' : d ? 'bg-gray-100 text-gray-800' : 'bg-transparent'}`}>
            {d || ''}
          </div>
        )))}
      </div>
    </div>
  );
};

export default CalendarMini;

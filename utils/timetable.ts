// utils/timetable.ts
// Utilities to compute timetable days and time slots based on school settings

import type { SchoolSettings } from '../types';

export type Slot = { label: string; type: 'period' | 'break'; index?: number };

export type TimetablePlan = {
  days: string[];
  timeSlots: string[]; // labels only (row headers)
  periodSlots: string[]; // labels for teaching periods only
  slotMeta: Record<string, Slot>; // label -> meta
  config: {
    periodMinutes: number;
    maxTeachingPeriods: number;
    fridayMaxTeachingPeriods: number;
    breakCount: 0 | 1 | 2;
    workDays: string[];
  };
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const date = new Date(2000, 0, 1, h, m, 0, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function range(n: number): number[] { return Array.from({ length: n }, (_, i) => i); }

export function computeTimetablePlan(settings?: Partial<SchoolSettings>): TimetablePlan {
  const defaults = {
    startTime: '08:00',
    periodMinutes: 40,
    maxTeachingPeriods: 8,
    fridayMaxTeachingPeriods: 6,
    breakCount: 1 as 0 | 1 | 2,
    firstBreakAfter: 3, // after 3 periods by default
    firstBreakMinutes: 15,
    secondBreakAfter: 6,
    secondBreakMinutes: 15,
    workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as string[],
  };

  const timetable = (settings as any)?.timetable || {};

  const cfg = {
    startTime: timetable.startTime || defaults.startTime,
    periodMinutes: timetable.periodMinutes ?? defaults.periodMinutes,
    maxTeachingPeriods: timetable.maxTeachingPeriods ?? defaults.maxTeachingPeriods,
    fridayMaxTeachingPeriods: timetable.fridayMaxTeachingPeriods ?? defaults.fridayMaxTeachingPeriods,
    breakCount: timetable.breakCount ?? defaults.breakCount,
    firstBreakAfter: timetable.firstBreakAfter ?? defaults.firstBreakAfter,
    firstBreakMinutes: timetable.firstBreakMinutes ?? defaults.firstBreakMinutes,
    secondBreakAfter: timetable.secondBreakAfter ?? defaults.secondBreakAfter,
    secondBreakMinutes: timetable.secondBreakMinutes ?? defaults.secondBreakMinutes,
    workDays: timetable.workDays || defaults.workDays,
  };

  const days = cfg.workDays;

  // Build the maximal slot grid (based on non-Friday max)
  const buildDaySlots = (maxPeriods: number): Slot[] => {
    let current = cfg.startTime;
    const slots: Slot[] = [];

    const breaks: { after: number; minutes: number }[] = [];
    if (cfg.breakCount >= 1) breaks.push({ after: cfg.firstBreakAfter, minutes: cfg.firstBreakMinutes });
    if (cfg.breakCount >= 2) breaks.push({ after: cfg.secondBreakAfter, minutes: cfg.secondBreakMinutes });

    range(maxPeriods).forEach((p) => {
      const start = current;
      const end = addMinutes(start, cfg.periodMinutes);
      const label = `${start} - ${end}`;
      slots.push({ label, type: 'period', index: p + 1 });
      current = end;

      const breakCfg = breaks.find(b => b.after === (p + 1));
      if (breakCfg) {
        const bStart = current;
        const bEnd = addMinutes(bStart, breakCfg.minutes);
        const bLabel = `${bStart} - ${bEnd} (Break)`;
        slots.push({ label: bLabel, type: 'break' });
        current = bEnd;
      }
    });

    return slots;
  };

  // Use the largest day to define the row headers
  const baseSlots = buildDaySlots(cfg.maxTeachingPeriods);

  // Note: Friday may close earlier; we keep headers uniform for the table.
  const slotMeta: Record<string, Slot> = {};
  baseSlots.forEach(s => { slotMeta[s.label] = s; });

  const timeSlots = baseSlots.map(s => s.label);
  const periodSlots = baseSlots.filter(s => s.type === 'period').map(s => s.label);

  return {
    days,
    timeSlots,
    periodSlots,
    slotMeta,
    config: {
      periodMinutes: cfg.periodMinutes,
      maxTeachingPeriods: cfg.maxTeachingPeriods,
      fridayMaxTeachingPeriods: cfg.fridayMaxTeachingPeriods,
      breakCount: cfg.breakCount,
      workDays: cfg.workDays,
    },
  };
}

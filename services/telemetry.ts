// services/telemetry.ts
export type PracticeEvent = {
  type: string;
  payload?: Record<string, any>;
  at: string;
};

const KEY = 'practice_events';

export function emitPracticeEvent(type: string, payload?: Record<string, any>) {
  try {
    const raw = localStorage.getItem(KEY);
    const arr: PracticeEvent[] = raw ? JSON.parse(raw) : [];
    arr.push({ type, payload, at: new Date().toISOString() });
    localStorage.setItem(KEY, JSON.stringify(arr));
  } catch (e) {
    // best-effort; ignore errors
  }
}

export function getPracticeEvents(): PracticeEvent[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}
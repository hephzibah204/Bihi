import { useEffect, useRef } from 'react';

type ProctorEvent = { event_type: string; payload?: any; created_at?: string };

const STORAGE_KEY = 'cbt_proctor_queue';

function readQueue(): ProctorEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || '[]';
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeQueue(queue: ProctorEvent[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch {}
}

export function useCbtProctoring(sessionId?: string) {
  const flushing = useRef(false);

  useEffect(() => {
    const enqueue = (evt: ProctorEvent) => {
      const q = readQueue();
      q.push({ ...evt, created_at: new Date().toISOString() });
      writeQueue(q);
    };

    const send = async (evt: ProctorEvent) => {
      if (!sessionId) return;
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cbt_proctor_events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '' },
          body: JSON.stringify({ session_id: sessionId, event_type: evt.event_type, payload: evt.payload })
        });
      } catch {
        enqueue(evt);
      }
    };

    const flushQueue = async () => {
      if (flushing.current) return;
      flushing.current = true;
      const q = readQueue();
      if (!q.length) { flushing.current = false; return; }
      writeQueue([]);
      for (const evt of q) {
        await send(evt);
      }
      flushing.current = false;
    };

    const onVisibility = () => {
      if (document.visibilityState !== 'visible') {
        send({ event_type: 'focus_loss' });
      }
    };
    const onClipboard = (e: ClipboardEvent) => {
      send({ event_type: 'clipboard', payload: { type: e.type } });
    };
    const onPageHide = () => {
      send({ event_type: 'tab_switch' });
    };
    const onRestore = () => {
      send({ event_type: 'restore' });
      flushQueue();
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onPageHide);
    window.addEventListener('focus', onRestore);
    window.addEventListener('copy', onClipboard as any);
    window.addEventListener('cut', onClipboard as any);
    window.addEventListener('paste', onClipboard as any);

    const onlineHandler = () => flushQueue();
    window.addEventListener('online', onlineHandler);

    flushQueue();

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onPageHide);
      window.removeEventListener('focus', onRestore);
      window.removeEventListener('copy', onClipboard as any);
      window.removeEventListener('cut', onClipboard as any);
      window.removeEventListener('paste', onClipboard as any);
      window.removeEventListener('online', onlineHandler);
    };
  }, [sessionId]);
}


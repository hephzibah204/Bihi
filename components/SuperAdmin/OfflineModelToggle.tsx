import React, { useEffect, useState } from 'react';
export const OfflineModelToggle: React.FC = () => {
  const [models, setModels] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  useEffect(() => {
    const m = localStorage.getItem('offline_model_name') || '';
    setSelected(m);
    (async () => {
      try {
        // Prefer server proxy to tags to avoid CORS
        const r = await Promise.race([
          fetch('/api/ai/ollama-tags', { method: 'GET' }),
          new Promise<Response>((_, reject) => setTimeout(() => reject(new Error('timeout')), 1200))
        ]);
        if (r && r.ok) {
          const j = await r.json();
          const names = Array.isArray(j?.models) ? j.models.map((x: any) => x.name) : Array.isArray(j) ? j.map((x: any) => x.name || x) : [];
          const defaults = ['llama3.1:latest','mistral:latest','qwen2:latest','phi3.5:mini'];
          const unique = Array.from(new Set([...defaults, ...names]));
          setModels(unique);
          setStatus('online');
        } else {
          setModels(['llama3.1:latest','mistral:latest','qwen2:latest','phi3.5:mini']);
          setStatus('offline');
        }
      } catch {
        setModels(['llama3.1:latest','mistral:latest','qwen2:latest','phi3.5:mini']);
        setStatus('offline');
      }
    })();
  }, []);
  const save = (name: string) => {
    setSelected(name);
    localStorage.setItem('offline_model_name', name);
    try {
      const s = JSON.parse(localStorage.getItem('sitewide_ai_settings') || '{}');
      s.offline_model_name = name;
      localStorage.setItem('sitewide_ai_settings', JSON.stringify(s));
    } catch {}
  };
  const clear = () => {
    setSelected('');
    localStorage.removeItem('offline_model_name');
    try {
      const s = JSON.parse(localStorage.getItem('sitewide_ai_settings') || '{}');
      delete s.offline_model_name;
      localStorage.setItem('sitewide_ai_settings', JSON.stringify(s));
    } catch {}
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-semibold">Offline Model</div>
        <div className="text-xs text-slate-600">{status === 'online' ? 'Ollama detected' : 'Ollama not detected'}</div>
      </div>
      <div className="flex gap-2 items-center">
        <select value={selected} onChange={(e) => save(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Auto</option>
          {models.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <button onClick={clear} className="px-3 py-2 rounded bg-slate-100 border">Clear</button>
      </div>
      <div className="text-xs text-slate-600">Auto picks strongest available if none selected.</div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { searchSimulations, listSimulations } from '../services/aiSimulations';
import Modal from './Modal';
import type { AiSimulationSearchResult } from '../types/ai';

const AI_SIMS_ENDPOINT: string =
  (import.meta.env?.VITE_AI_SIMULATIONS_FUNCTION_URL as string) ||
  'https://shzwolantavauszuxwlp.supabase.co/functions/v1/ai_simulations';

type PhETSlim = {
  title: string;
  subject?: string;
  keywords?: string[];
  simulations: { id: string; url: string }[];
};

const ELaboratory: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AiSimulationSearchResult[]>([]);
  const [browseList, setBrowseList] = useState<PhETSlim[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalUrl, setModalUrl] = useState('');

  const runSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setIsSearching(true);
    try {
      // Try Supabase Edge Function first
      const resp = await fetch(`${AI_SIMS_ENDPOINT}?q=${encodeURIComponent(q)}&limit=5`);
      if (resp.ok) {
        const data: any[] = await resp.json();
        const mapped: AiSimulationSearchResult[] = (Array.isArray(data) ? data : []).map((item: any) => {
          const first = Array.isArray(item.simulations) ? item.simulations[0] : undefined;
          return {
            id: first?.id || item.id || item.title,
            title: item.title,
            description: item.description || '',
            url: first?.url || item.url || '',
            image_url: item.image_url || '',
            subject: item.subject || '',
            keywords: item.keywords || [],
            provider: 'PhET',
            score: 0.8,
          } as AiSimulationSearchResult;
        });
        setResults(mapped);
      } else {
        // Fallback to local Supabase table search
        const res = await searchSimulations(q, { limit: 5 });
        setResults(res);
      }
    } catch {
      try {
        const res = await searchSimulations(q, { limit: 5 });
        setResults(res);
      } catch {
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const openSim = (sim: AiSimulationSearchResult) => {
    setModalTitle(sim.title || 'Simulation');
    setModalUrl(sim.url || '');
    setIsModalOpen(true);
  };

  useEffect(() => {
    // Initial browse list using Supabase Edge Function (with fallback inside the function)
    const loadBrowse = async () => {
      try {
        const res = await fetch(`${AI_SIMS_ENDPOINT}?limit=8`);
        if (res.ok) {
          const data: PhETSlim[] = await res.json();
          setBrowseList(Array.isArray(data) ? data : []);
          return;
        }
        // Fallback to local/supabase sims list
        const local = await listSimulations({ limit: 8 });
        const mapped: PhETSlim[] = local.map((s) => ({
          title: s.title,
          subject: s.subject,
          keywords: s.keywords,
          simulations: [{ id: s.id, url: s.url }],
        }));
        setBrowseList(mapped);
      } catch {
        // Final fallback: local/supabase sims list
        try {
          const local = await listSimulations({ limit: 8 });
          const mapped: PhETSlim[] = local.map((s) => ({
            title: s.title,
            subject: s.subject,
            keywords: s.keywords,
            simulations: [{ id: s.id, url: s.url }],
          }));
          setBrowseList(mapped);
        } catch {
          setBrowseList([]);
        }
      }
    };
    loadBrowse();
  }, []);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">E-Laboratory</h2>
          <p className="text-sm text-gray-600">Find and run interactive PhET simulations.</p>
        </div>
      </div>
      <form onSubmit={runSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g., Ohm's law, gravity, circuits"
          className="input flex-1"
        />
        <button type="submit" className="btn" disabled={isSearching || !query.trim()}>
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </form>
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((sim) => (
            <div key={sim.id} className="border rounded-lg p-3">
              <div className="flex gap-3">
                {sim.image_url ? (
                  <img src={sim.image_url} alt={sim.title} className="w-24 h-24 object-cover rounded" />
                ) : (
                  <div className="w-24 h-24 bg-gray-200 rounded" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{sim.title}</div>
                  {sim.description && <div className="text-sm text-gray-600 line-clamp-3">{sim.description}</div>}
                  <div className="mt-2 flex gap-2">
                    <button type="button" className="btn" onClick={() => openSim(sim)}>Open Simulation</button>
                    {sim.url && (
                      <a className="btn-secondary" href={sim.url} target="_blank" rel="noreferrer">Open in new tab</a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          <div className="text-sm text-gray-600 mb-3">Browse popular simulations:</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {browseList.map((item) => {
              const first = item.simulations?.[0];
              const url = first?.url || '';
              return (
                <div key={first?.id || item.title} className="border rounded-lg p-3">
                  <h4 className="font-medium mb-2">{item.title}</h4>
                  {url ? (
                    <iframe src={url} className="w-full aspect-square rounded-md border-0" loading="lazy" title={item.title} />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 rounded" />
                  )}
                  <div className="mt-2 flex gap-2">
                    {url && (
                      <a className="btn" href={url} target="_blank" rel="noreferrer">Open Full Simulation</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle} size="full">
        <div className="p-4">
          {modalUrl ? (
            <iframe src={modalUrl} className="w-full h-[70vh] rounded-xl border-0" title={modalTitle} />
          ) : (
            <div className="text-gray-600">No simulation selected.</div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ELaboratory;
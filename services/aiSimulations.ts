import { getSupabase, isSupabaseOnline } from './supabaseClient';
import { logger } from '../utils/logger';
import type { AiSimulation, AiSimulationSearchResult } from '../types/ai';

const FALLBACK_SIMS: AiSimulation[] = [
  {
    id: 'ohms-law',
    title: "Ohm's Law",
    subject: 'physics',
    description: 'Explore how voltage, current, and resistance relate.',
    keywords: ['electricity', 'resistance', 'current', 'voltage'],
    url: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_en.html',
    image_url: 'https://phet.colorado.edu/sims/html/ohms-law/latest/screenshot.png',
    languages: ['en'],
    provider: 'PhET',
  },
  {
    id: 'gravity-force-lab',
    title: 'Gravity Force Lab',
    subject: 'physics',
    description: 'Investigate how mass and distance affect gravity.',
    keywords: ['gravity', 'mass', 'distance', 'force'],
    url: 'https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_en.html',
    image_url: 'https://phet.colorado.edu/sims/html/gravity-force-lab/latest/screenshot.png',
    languages: ['en'],
    provider: 'PhET',
  },
];

export interface SimulationQueryOptions {
  limit?: number;
}

export async function listSimulations(opts: SimulationQueryOptions = {}): Promise<AiSimulation[]> {
  try {
    const online = await isSupabaseOnline();
    if (!online) return FALLBACK_SIMS.slice(0, opts.limit || FALLBACK_SIMS.length);
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('ai_simulations')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(opts.limit || 50);
    if (error) throw error;
    return (data as AiSimulation[]) || [];
  } catch (e) {
    logger.warn('listSimulations failed; returning fallback', { error: (e as any)?.message });
    return FALLBACK_SIMS.slice(0, opts.limit || FALLBACK_SIMS.length);
  }
}

export async function searchSimulations(query: string, opts: SimulationQueryOptions = {}): Promise<AiSimulationSearchResult[]> {
  const limit = opts.limit || 5;
  try {
    const online = await isSupabaseOnline();
    if (!online) {
      // Simple local search over fallbacks
      const q = query.toLowerCase();
      const scored = FALLBACK_SIMS.map(s => {
        const text = `${s.title} ${s.description || ''} ${s.subject || ''} ${(s.keywords || []).join(' ')}`.toLowerCase();
        const score = text.includes(q) ? 0.9 : 0.3;
        return { ...s, score };
      })
      .filter(s => s.score && s.score > 0.4)
      .slice(0, limit);
      return scored;
    }
    const supabase = await getSupabase();
    // Try Postgres full-text on title first; fallback to OR filters across fields
    let { data, error } = await supabase
      .from('ai_simulations')
      .select('*')
      .textSearch('title', query)
      .limit(limit);
    if (error) {
      // Fallback to ilike OR
      const orQuery = `title.ilike.%${query}%,description.ilike.%${query}%,subject.ilike.%${query}%`;
      const { data: data2, error: error2 } = await supabase
        .from('ai_simulations')
        .select('*')
        .or(orQuery)
        .limit(limit);
      if (error2) throw error2;
      data = data2;
    }
    return ((data || []) as AiSimulation[]).map(s => ({ ...s, score: 0.8 }));
  } catch (e) {
    logger.error('searchSimulations failed', { error: (e as any)?.message });
    return [];
  }
}

export function getSimulationByIdLocal(id: string): AiSimulation | undefined {
  return FALLBACK_SIMS.find(s => s.id === id);
}